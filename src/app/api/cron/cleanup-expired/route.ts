import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/cleanup-expired
 *
 * Deletes tenants whose subscription was cancelled (cancelAtPeriodEnd = true)
 * and whose billing period has ended (currentPeriodEnd < now).
 *
 * Designed to be called by Vercel Cron or an external scheduler (e.g. daily).
 * Protected by CRON_SECRET to prevent unauthorized access.
 *
 * To configure in Vercel, add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/cleanup-expired", "schedule": "0 3 * * *" }] }
 */
export async function GET(request: NextRequest) {
  // ── Auth: verify cron secret ──
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find tenants marked for cancellation whose period has ended
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        currentPeriodEnd: true,
      },
    });

    if (expiredTenants.length === 0) {
      return NextResponse.json({
        message: 'No hay cuentas vencidas para eliminar.',
        deleted: 0,
      });
    }

    const results: { id: string; name: string; status: 'deleted' | 'error'; error?: string }[] = [];

    for (const tenant of expiredTenants) {
      try {
        // Get user IDs before deletion
        const memberships = await prisma.tenantUserMembership.findMany({
          where: { tenantId: tenant.id },
          select: { userId: true },
        });
        const userIds = memberships.map((m) => m.userId);

        await prisma.$transaction(async (tx) => {
          // Delete tenant (cascades to memberships, modules, fields, etc.)
          await tx.tenant.delete({ where: { id: tenant.id } });

          // Delete orphaned users (those not belonging to any other tenant)
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

        console.log(`[Cron] ✓ Tenant "${tenant.name}" (${tenant.id}) eliminado. Período finalizó: ${tenant.currentPeriodEnd?.toISOString()}`);
        results.push({ id: tenant.id, name: tenant.name, status: 'deleted' });
      } catch (err) {
        console.error(`[Cron] ✗ Error eliminando Tenant "${tenant.name}" (${tenant.id}):`, err);
        results.push({
          id: tenant.id,
          name: tenant.name,
          status: 'error',
          error: err instanceof Error ? err.message : 'Error desconocido',
        });
      }
    }

    const deletedCount = results.filter((r) => r.status === 'deleted').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    console.log(`[Cron] Limpieza completada: ${deletedCount} eliminados, ${errorCount} errores.`);

    return NextResponse.json({
      message: `Limpieza completada: ${deletedCount} cuentas eliminadas.`,
      deleted: deletedCount,
      errors: errorCount,
      details: results,
    });
  } catch (err) {
    console.error('[Cron] Error general en cleanup-expired:', err);
    return NextResponse.json(
      { error: 'Error interno al ejecutar la limpieza.' },
      { status: 500 }
    );
  }
}
