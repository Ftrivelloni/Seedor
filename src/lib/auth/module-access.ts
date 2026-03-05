import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { ModuleKey } from '@prisma/client';

/**
 * Checks if a specific optional module is enabled for a tenant.
 * If disabled, redirects the user to the dashboard.
 *
 * Call this from Server Components (pages) to gate access to
 * optional modules (MACHINERY, PACKAGING, SALES).
 */
export async function requireModuleEnabled(
  tenantId: string,
  moduleKey: ModuleKey
): Promise<void> {
  const setting = await prisma.tenantModuleSetting.findUnique({
    where: { tenantId_module: { tenantId, module: moduleKey } },
    select: { enabled: true },
  });

  // If no setting exists or it's disabled, redirect to dashboard
  if (!setting || !setting.enabled) {
    redirect('/dashboard');
  }
}
