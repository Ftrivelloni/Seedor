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
 * Requires the tenant name as confirmation text for security.
 * The actual data cleanup is handled by the cron job (cleanup-expired).
 *
 * @param confirmationText - Must match the tenant name (case-insensitive) for safety.
 */
export async function cancelSubscriptionAction(
  confirmationText: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole(['ADMIN']);

  if (!confirmationText || typeof confirmationText !== 'string') {
    return { success: false, error: 'Debés escribir el nombre de la empresa para confirmar.' };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      name: true,
      subscriptionStatus: true,
      mpPreapprovalId: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!tenant) return { success: false, error: 'Tenant no encontrado.' };

  // Validate confirmation text matches tenant name (case-insensitive)
  if (confirmationText.trim().toLowerCase() !== tenant.name.trim().toLowerCase()) {
    return { success: false, error: 'El nombre ingresado no coincide con el de la empresa.' };
  }

  if (tenant.subscriptionStatus !== 'ACTIVE' && tenant.subscriptionStatus !== 'PAST_DUE') {
    return { success: false, error: 'No hay una suscripción activa para cancelar.' };
  }

  if (tenant.cancelAtPeriodEnd) {
    return { success: false, error: 'La suscripción ya está marcada para cancelar al fin del período.' };
  }

  if (!tenant.mpPreapprovalId) {
    return { success: false, error: 'No se encontró la suscripción en Mercado Pago.' };
  }

  try {
    // Cancel directly in Mercado Pago
    await mpPreApproval.update({
      id: tenant.mpPreapprovalId,
      body: { status: 'cancelled' },
    });

    // Mark tenant for cancellation at period end
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { cancelAtPeriodEnd: true },
    });

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (err: unknown) {
    console.error('[cancelSubscriptionAction] Error:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido al cancelar.';
    return { success: false, error: `Error al cancelar la suscripción: ${message}` };
  }
}

// ═══════════════════════════════════════════════════════
// SUSCRIPCIÓN — Reactivar (ADMIN only)
// ═══════════════════════════════════════════════════════

/**
 * Reactivates a cancelled subscription by creating a new MP preapproval
 * starting from the next billing period (currentPeriodEnd).
 * Clears cancelAtPeriodEnd and updates mpPreapprovalId.
 */
export async function reactivateSubscriptionAction(): Promise<{
  success: boolean;
  error?: string;
  redirectUrl?: string;
}> {
  const session = await requireRole(['ADMIN']);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true,
      name: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
      planInterval: true,
      mpPayerEmail: true,
      subscriptionStatus: true,
      mpPreapprovalId: true,
    },
  });

  if (!tenant) return { success: false, error: 'Tenant no encontrado.' };

  if (!tenant.cancelAtPeriodEnd) {
    return { success: false, error: 'La suscripción no está marcada para cancelar.' };
  }

  try {
    // Check if there's already a pending reactivation
    // If mpPreapprovalId exists and cancelAtPeriodEnd is still true,
    // it means the user started reactivation but didn't complete payment
    if (tenant.mpPreapprovalId && tenant.subscriptionStatus === 'ACTIVE') {
      // There's already an active preapproval, try to get its init_point
      try {
        const existingPreapproval = await mpPreApproval.get({ id: tenant.mpPreapprovalId });
        const raw = existingPreapproval as unknown as Record<string, unknown>;
        
        // If it's in pending status, reuse it
        if (existingPreapproval.status === 'pending') {
          const initPoint = typeof raw.init_point === 'string' ? raw.init_point : null;
          const sandboxInitPoint = typeof raw.sandbox_init_point === 'string' ? raw.sandbox_init_point : null;
          
          if (initPoint || sandboxInitPoint) {
            console.log(`[reactivateSubscriptionAction] Reusando preapproval pendiente ${tenant.mpPreapprovalId}`);
            return { success: true, redirectUrl: (initPoint || sandboxInitPoint)! };
          }
        }
      } catch (mpErr) {
        // If fetching fails, continue to create a new one
        console.warn('[reactivateSubscriptionAction] Error al obtener preapproval existente:', mpErr);
      }
    }

    // Recalculate price based on current modules
    const pricing = await calculateSubscriptionPrice(session.tenantId);
    const exchangeRate = await getUsdToArsRate();
    const totalArs = convertUsdToArs(pricing.totalPerMonth, exchangeRate);

    if (totalArs <= 0) {
      return { success: false, error: 'El monto calculado no es válido. Verificá la tasa de cambio.' };
    }

    const isYearly = tenant.planInterval === 'ANNUAL';
    const mpFrequency = isYearly ? 12 : 1;

    // Start date: beginning of next period (so current period is already paid)
    // If the period already ended, start 1 minute from now (MP doesn't accept past dates)
    let startDate: Date;
    
    if (tenant.currentPeriodEnd) {
      const periodEnd = new Date(tenant.currentPeriodEnd);
      const now = new Date();
      
      if (periodEnd > now) {
        // Period hasn't ended yet, start from period end
        startDate = periodEnd;
      } else {
        // Period already ended, start 1 minute from now
        startDate = new Date(now.getTime() + 60 * 1000);
      }
    } else {
      // No period end date, start 1 minute from now
      startDate = new Date(Date.now() + 60 * 1000);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seedor.com.ar';

    const preapproval = await mpPreApproval.create({
      body: {
        payer_email: tenant.mpPayerEmail || session.email,
        reason: `Suscripción Seedor ${isYearly ? 'Anual' : 'Mensual'} - ${tenant.name} (Reactivación)`,
        external_reference: tenant.id,
        auto_recurring: {
          frequency: mpFrequency,
          frequency_type: 'months' as const,
          transaction_amount: totalArs,
          currency_id: 'ARS' as const,
          start_date: startDate.toISOString(),
        },
        back_url: `${appUrl}/dashboard/configuracion`,
      },
    });

    if (!preapproval?.id || !preapproval?.init_point) {
      return { success: false, error: 'No se pudo crear la nueva suscripción. Intentá de nuevo.' };
    }

    // Update tenant: new preapproval, but KEEP cancelAtPeriodEnd=true
    // It will be cleared by the webhook when MP confirms the subscription is authorized
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        mpPreapprovalId: preapproval.id,
        // Don't clear cancelAtPeriodEnd yet - wait for webhook confirmation
      },
    });

    revalidatePath('/dashboard/configuracion');
    return { success: true, redirectUrl: preapproval.init_point as string };
  } catch (err: unknown) {
    console.error('[reactivateSubscriptionAction] Error:', err);
    
    let message = 'Error desconocido.';
    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === 'object') {
      const mpErr = err as { message?: string; status?: number };
      message = mpErr.message || JSON.stringify(err);
    }
    
    return { success: false, error: `Error al reactivar la suscripción: ${message}` };
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

  // Allow payment method changes for active or past due subscriptions
  const ALLOWED_STATUSES = new Set(['ACTIVE', 'PAST_DUE']);
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


