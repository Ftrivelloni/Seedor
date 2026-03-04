import { AppLayout } from '@/components/dashboard/AppLayout';
import { requireAuthSession } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import type { ModuleKey } from '@prisma/client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuthSession();

  // Fetch which optional modules are enabled for this tenant
  const moduleSettings = await prisma.tenantModuleSetting.findMany({
    where: { tenantId: session.tenantId, enabled: true },
    select: { module: true },
  });

  const enabledModules = moduleSettings.map((s) => s.module) as ModuleKey[];

  return (
    <AppLayout
      user={{
        firstName: session.firstName,
        lastName: session.lastName,
        role: session.role,
      }}
      enabledModules={enabledModules}
    >
      {children}
    </AppLayout>
  );
}
