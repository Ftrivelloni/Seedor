import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthSession, hasRequiredRole } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { mpPreApproval } from '@/lib/mercadopago';

/**
 * POST /api/account/delete
 *
 * Permanently deletes the tenant account (organization) and all associated data.
 * Before deleting, it cancels any active Mercado Pago subscription to prevent
 * orphaned recurring charges.
 *
 * Body (JSON):
 *   - confirmationText: string  (must match the tenant name for safety)
 *
 * Security:
 *   - Only ADMIN users can delete the account.
 *   - Requires exact tenant name confirmation to prevent accidental deletions.
 *
 * Flow:
 *   1. Authenticate → only ADMIN
 *   2. Validate confirmation text matches tenant name
 *   3. Cancel MP subscription if active (prevent orphaned charges)
 *   4. Delete all tenant data (cascades via Prisma relations)
 *   5. Delete all users associated with the tenant
 *   6. Return success → client must clear session and redirect
 */
export async function POST(request: NextRequest) {
  // ── 1. Auth ──
  const session = await getApiAuthSession(request);
  if (!session || !hasRequiredRole(session, ['ADMIN'])) {
    return NextResponse.json(
      { error: 'No autorizado. Solo el administrador puede eliminar la cuenta.' },
      { status: 401 }
    );
  }

  // ── 2. Parse and validate body ──
  let body: { confirmationText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud no es JSON válido.' },
      { status: 400 }
    );
  }

  const { confirmationText } = body;

  if (!confirmationText || typeof confirmationText !== 'string') {
    return NextResponse.json(
      { error: 'Debés escribir el nombre de la empresa para confirmar.' },
      { status: 400 }
    );
  }

  // ── 3. Fetch tenant ──
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
    return NextResponse.json({ error: 'Tenant no encontrado.' }, { status: 404 });
  }

  // Validate confirmation text matches tenant name (case-insensitive)
  if (confirmationText.trim().toLowerCase() !== tenant.name.trim().toLowerCase()) {
    return NextResponse.json(
      { error: 'El nombre ingresado no coincide con el de la empresa. Verificá e intentá de nuevo.' },
      { status: 400 }
    );
  }

  // ── 4. Cancel MP subscription if active ──
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
      // Log the error but continue with deletion — the subscription should
      // not prevent account deletion. Worst case, MP will fail to charge
      // once the tenant no longer exists and eventually cancel automatically.
      console.error(
        `⚠️ ELIMINACIÓN DE CUENTA: No se pudo cancelar la suscripción MP ${tenant.mpPreapprovalId} para tenant "${tenant.name}". Continuando con eliminación.`,
        mpErr
      );
    }
  }

  try {
    // ── 5. Delete all tenant data in a transaction ──
    // Prisma cascades handle most relations, but we need to explicitly
    // delete users since User → Tenant is a many-to-many via TenantUserMembership.
    await prisma.$transaction(async (tx) => {
      // Get all user IDs associated with this tenant
      const memberships = await tx.tenantUserMembership.findMany({
        where: { tenantId: tenant.id },
        select: { userId: true },
      });
      const userIds = memberships.map((m) => m.userId);

      // Delete the tenant (cascades to memberships, modules, fields, etc.)
      await tx.tenant.delete({
        where: { id: tenant.id },
      });

      // Delete orphaned users (they belonged only to this tenant)
      if (userIds.length > 0) {
        // Only delete users that don't have memberships in OTHER tenants
        // (in case multi-tenancy is supported in the future)
        const usersWithOtherTenants = await tx.tenantUserMembership.findMany({
          where: {
            userId: { in: userIds },
            tenantId: { not: tenant.id },
          },
          select: { userId: true },
        });
        const usersToKeep = new Set(usersWithOtherTenants.map((m) => m.userId));
        const usersToDelete = userIds.filter((id) => !usersToKeep.has(id));

        if (usersToDelete.length > 0) {
          await tx.user.deleteMany({
            where: { id: { in: usersToDelete } },
          });
        }
      }
    });

    console.log(
      `🔴 ELIMINACIÓN DE CUENTA COMPLETADA: Tenant "${tenant.name}" (${tenant.id}) eliminado. ` +
      `Suscripción MP cancelada: ${mpCanceled ? 'Sí' : 'No (no había suscripción activa o falló)'}.`
    );

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada correctamente.',
      mpCanceled,
    });
  } catch (err: unknown) {
    console.error('[Account Delete Error]', err);

    let message = 'Error desconocido al eliminar la cuenta.';
    if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json(
      { error: `Error al eliminar la cuenta: ${message}` },
      { status: 500 }
    );
  }
}
