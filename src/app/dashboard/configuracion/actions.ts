'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuthSession, requireRole } from '@/lib/auth/auth';
import { mpPreApproval } from '@/lib/mercadopago';
import { calculateSubscriptionPrice, convertUsdToArs } from '@/lib/domain/subscription';
import { getUsdToArsRate } from '@/lib/utils/exchange-rate';

// ═══════════════════════════════════════════════════════
// MI CUENTA — Available to all authenticated users
// ═══════════════════════════════════════════════════════

/**
 * Update the current user's personal information.
 */
export async function updateProfileAction(formData: FormData) {
  const session = await requireAuthSession();

  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const phone = String(formData.get('phone') || '').trim();

  if (!firstName) throw new Error('El nombre es obligatorio.');
  if (firstName.length > 100) throw new Error('El nombre no puede superar los 100 caracteres.');
  if (!lastName) throw new Error('El apellido es obligatorio.');
  if (lastName.length > 100) throw new Error('El apellido no puede superar los 100 caracteres.');
  if (!email) throw new Error('El email es obligatorio.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El email no es válido.');
  if (!phone) throw new Error('El teléfono es obligatorio.');

  // Check email uniqueness (excluding current user)
  const existingUser = await prisma.user.findFirst({
    where: { email, id: { not: session.userId } },
  });
  if (existingUser) throw new Error('Ya existe un usuario con ese email.');

  await prisma.user.update({
    where: { id: session.userId },
    data: { firstName, lastName, email, phone },
  });

  revalidatePath('/dashboard/configuracion');
}

/**
 * Update the current user's notification settings.
 */
export async function updateNotificationsAction(formData: FormData) {
  const session = await requireAuthSession();

  const emailNotifications = formData.get('emailNotifications') === 'true';
  const whatsappNotifications = formData.get('whatsappNotifications') === 'true';
  const dailySummary = formData.get('dailySummary') === 'true';

  await prisma.user.update({
    where: { id: session.userId },
    data: { emailNotifications, whatsappNotifications, dailySummary },
  });

  revalidatePath('/dashboard/configuracion');
}

// ═══════════════════════════════════════════════════════
// EMPRESA — ADMIN only
// ═══════════════════════════════════════════════════════

/**
 * Update tenant organization details.
 */
export async function updateTenantAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);

  const name = String(formData.get('name') || '').trim();
  const cuit = String(formData.get('cuit') || '').trim() || null;
  const companyPhone = String(formData.get('companyPhone') || '').trim() || null;
  const companyAddress = String(formData.get('companyAddress') || '').trim() || null;

  if (!name) throw new Error('El nombre de la empresa es obligatorio.');
  if (name.length > 200) throw new Error('El nombre no puede superar los 200 caracteres.');
  if (cuit && !/^\d{2}-\d{8}-\d$/.test(cuit)) throw new Error('El CUIT debe tener el formato XX-XXXXXXXX-X.');

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { name, cuit, companyPhone, companyAddress },
  });

  revalidatePath('/dashboard/configuracion');
}

// ═══════════════════════════════════════════════════════
// SUSCRIPCIÓN — ADMIN only (cancel)
// ═══════════════════════════════════════════════════════

/**
 * Mark the subscription to cancel at the end of the current period.
 * The actual cancellation is handled by the webhook when MP notifies us.
 */
export async function cancelSubscriptionAction(): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole(['ADMIN']);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      subscriptionStatus: true,
      mpPreapprovalId: true,
    },
  });

  if (!tenant) return { success: false, error: 'Tenant no encontrado.' };

  if (tenant.subscriptionStatus !== 'ACTIVE') {
    return { success: false, error: 'No hay una suscripción activa para cancelar.' };
  }

  if (!tenant.mpPreapprovalId) {
    return { success: false, error: 'No se encontró la suscripción en Mercado Pago.' };
  }

  try {
    // Call the API route to handle MP cancellation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${appUrl}/api/subscriptions/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: session.tenantId }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Error al cancelar la suscripción.' };
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch {
    return { success: false, error: 'Error de comunicación al cancelar la suscripción.' };
  }
}

// ═══════════════════════════════════════════════════════
// PLAN — Toggle módulos opcionales y actualizar MP
// ═══════════════════════════════════════════════════════

/**
 * Saves the enabled/disabled state of optional modules using asymmetric
 * billing logic:
 *
 * • **Activations** → DB `enabled: true` + immediately increase MP
 *   `transaction_amount` by $20 per new module (the next automatic charge
 *   already includes the new module).
 *
 * • **Deactivations** → DB `enabled: false` (module disappears from the UI
 *   right away) but the MP price is **NOT reduced** here. The current-period
 *   charge must still cover the month the module was active.  Price reduction
 *   happens later inside the webhook after a successful payment (see
 *   `recalculateSubscriptionPrice` in the webhook handler).
 *
 * @param enabledModules - Array of optional module keys that should be ON after the change
 */
export async function updatePlanModulesAction(
  enabledModules: string[]
): Promise<{
  success: boolean;
  error?: string;
  newTotalUsd?: number;
  hasActivations?: boolean;
  hasDeactivations?: boolean;
}> {
  const session = await requireRole(['ADMIN']);

  const OPTIONAL_MODULES = ['PACKAGING', 'MACHINERY', 'SALES'] as const;

  // Validate all provided keys are optional modules
  for (const key of enabledModules) {
    if (!(OPTIONAL_MODULES as readonly string[]).includes(key)) {
      return { success: false, error: `Módulo no válido: ${key}` };
    }
  }

  try {
    // ── 1. Determine what changed vs. the current DB state ──
    const currentSettings = await prisma.tenantModuleSetting.findMany({
      where: { tenantId: session.tenantId, module: { in: [...OPTIONAL_MODULES] } },
      select: { module: true, enabled: true },
    });

    const previouslyEnabled = new Set(
      currentSettings.filter((s) => s.enabled).map((s) => s.module)
    );

    const activatedModules = enabledModules.filter((k) => !previouslyEnabled.has(k as typeof OPTIONAL_MODULES[number]));
    const deactivatedModules = [...previouslyEnabled].filter((k) => !enabledModules.includes(k));

    const hasActivations = activatedModules.length > 0;
    const hasDeactivations = deactivatedModules.length > 0;

    // ── 2. Upsert every optional module's enabled state in one TX ──
    await prisma.$transaction(
      OPTIONAL_MODULES.map((key) =>
        prisma.tenantModuleSetting.upsert({
          where: { tenantId_module: { tenantId: session.tenantId, module: key } },
          update: { enabled: enabledModules.includes(key) },
          create: { tenantId: session.tenantId, module: key, enabled: enabledModules.includes(key) },
        })
      )
    );

    // ── 3. Recalculate the *logical* new total (for UI display) ──
    const pricing = await calculateSubscriptionPrice(session.tenantId);

    // ── 4. Only touch MP when modules were ACTIVATED (not deactivated) ──
    //   • On activation  → increase amount immediately so next charge covers it
    //   • On deactivation → leave amount unchanged; webhook will reduce it after payment
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { mpPreapprovalId: true, subscriptionStatus: true, planInterval: true },
    });

    if (hasActivations && tenant?.mpPreapprovalId && tenant.subscriptionStatus === 'ACTIVE') {
      try {
        // Get current exchange rate to convert the new price to ARS
        const exchangeRate = await getUsdToArsRate();
        
        // Use the recalculated price (which already includes all enabled modules)
        // and convert it to ARS for Mercado Pago.
        // Both MONTHLY and ANNUAL plans charge the monthly amount.
        const newAmountArs = convertUsdToArs(pricing.totalPerMonth, exchangeRate);

        await mpPreApproval.update({
          id: tenant.mpPreapprovalId,
          body: {
            auto_recurring: {
              transaction_amount: newAmountArs,
            },
          } as unknown as Parameters<typeof mpPreApproval.update>[0]['body'],
        });
      } catch (mpErr) {
        console.error('[updatePlanModulesAction] Error actualizando monto en MP:', mpErr);
        revalidatePath('/dashboard/configuracion');
        return {
          success: true,
          newTotalUsd: pricing.totalUsd,
          hasActivations,
          hasDeactivations,
          error: 'El plan se actualizó pero no se pudo sincronizar con Mercado Pago. Será aplicado en el próximo ciclo.',
        };
      }
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true, newTotalUsd: pricing.totalUsd, hasActivations, hasDeactivations };
  } catch {
    return { success: false, error: 'Error al actualizar el plan. Intentá de nuevo.' };
  }
}

// ═══════════════════════════════════════════════════════
// MÉTODO DE PAGO — Generar URL de actualización MP
// ═══════════════════════════════════════════════════════

/**
 * Generates a Mercado Pago URL so the user can update their payment method.
 * MP's Preapproval API provides a `init_point` that redirects the user to
 * a hosted page where they can enter a new card.
 */
export async function getChangePaymentMethodUrlAction(): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const session = await requireRole(['ADMIN']);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { mpPreapprovalId: true, subscriptionStatus: true },
  });

  if (!tenant?.mpPreapprovalId) {
    return { success: false, error: 'No se encontró una suscripción activa en Mercado Pago.' };
  }

  // Allow payment method changes for active or trialing subscriptions
  const ALLOWED_STATUSES = new Set(['ACTIVE', 'TRIALING', 'PAST_DUE']);
  if (!ALLOWED_STATUSES.has(tenant.subscriptionStatus)) {
    return { success: false, error: 'La suscripción no está activa.' };
  }

  try {
    // Fetch the current preapproval to get the init_point URL
    const preapproval = await mpPreApproval.get({ id: tenant.mpPreapprovalId });
    const raw = preapproval as unknown as Record<string, unknown>;

    // Try init_point first, then fall back to the standard MP hosted URL
    const initPoint = typeof raw.init_point === 'string' ? raw.init_point : null;
    const sandboxInitPoint = typeof raw.sandbox_init_point === 'string' ? raw.sandbox_init_point : null;
    // MP standard URL for managing a preapproval subscription
    const fallbackUrl = `https://www.mercadopago.com.ar/subscriptions/manage/${tenant.mpPreapprovalId}`;

    const url = initPoint || sandboxInitPoint || fallbackUrl;

    return { success: true, url };
  } catch (err) {
    console.error('[getChangePaymentMethodUrlAction] Error:', err);
    return { success: false, error: 'Error al conectar con Mercado Pago. Intentá de nuevo.' };
  }
}

// ═══════════════════════════════════════════════════════
// ELIMINAR CUENTA — ADMIN only (destructive)
// ═══════════════════════════════════════════════════════

/**
 * Permanently deletes the tenant account and all associated data.
 * Cancels any active MP subscription before deletion to prevent orphaned charges.
 *
 * @param confirmationText - Must match the tenant name (case-insensitive) for safety.
 */
export async function deleteTenantAccountAction(
  confirmationText: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole(['ADMIN']);

  if (!confirmationText || typeof confirmationText !== 'string') {
    return { success: false, error: 'Debés escribir el nombre de la empresa para confirmar.' };
  }

  // ── 1. Fetch tenant ──
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      mpPreapprovalId: true,
    },
  });

  if (!tenant) {
    return { success: false, error: 'Tenant no encontrado.' };
  }

  // Validate confirmation text matches tenant name (case-insensitive)
  if (confirmationText.trim().toLowerCase() !== tenant.name.trim().toLowerCase()) {
    return { success: false, error: 'El nombre ingresado no coincide con el de la empresa.' };
  }

  // ── 2. Cancel MP subscription if active ──
  let mpCanceled = false;
  const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING', 'PAST_DUE']);

  if (tenant.mpPreapprovalId && ACTIVE_STATUSES.has(tenant.subscriptionStatus)) {
    try {
      await mpPreApproval.update({
        id: tenant.mpPreapprovalId,
        body: { status: 'cancelled' },
      });
      mpCanceled = true;
      console.log(
        `🔴 ELIMINACIÓN DE CUENTA: Suscripción MP ${tenant.mpPreapprovalId} cancelada para tenant "${tenant.name}" (${tenant.id})`
      );
    } catch (mpErr) {
      console.error(
        `⚠️ ELIMINACIÓN DE CUENTA: No se pudo cancelar la suscripción MP ${tenant.mpPreapprovalId}. Continuando con eliminación.`,
        mpErr
      );
    }
  }

  // ── 3. Delete all tenant data in a transaction ──
  try {
    await prisma.$transaction(async (tx) => {
      const memberships = await tx.tenantUserMembership.findMany({
        where: { tenantId: tenant.id },
        select: { userId: true },
      });
      const userIds = memberships.map((m) => m.userId);

      // Delete tenant (cascades to memberships, modules, fields, etc.)
      await tx.tenant.delete({ where: { id: tenant.id } });

      // Delete orphaned users
      if (userIds.length > 0) {
        const usersWithOtherTenants = await tx.tenantUserMembership.findMany({
          where: { userId: { in: userIds }, tenantId: { not: tenant.id } },
          select: { userId: true },
        });
        const usersToKeep = new Set(usersWithOtherTenants.map((m) => m.userId));
        const usersToDelete = userIds.filter((id) => !usersToKeep.has(id));

        if (usersToDelete.length > 0) {
          await tx.user.deleteMany({ where: { id: { in: usersToDelete } } });
        }
      }
    });

    console.log(
      `🔴 ELIMINACIÓN DE CUENTA COMPLETADA: Tenant "${tenant.name}" (${tenant.id}) eliminado. ` +
      `Suscripción MP cancelada: ${mpCanceled ? 'Sí' : 'No'}.`
    );

    return { success: true };
  } catch (err) {
    console.error('[deleteTenantAccountAction] Error:', err);
    return { success: false, error: 'Error al eliminar la cuenta. Intentá de nuevo.' };
  }
}
