import { Suspense } from 'react';
import { requireAuthSession } from '@/lib/auth/auth';
import { requireModuleEnabled } from '@/lib/auth/module-access';
import { EmpaqueLayoutClient } from './EmpaqueLayoutClient';

export default async function EmpaqueLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuthSession();
  await requireModuleEnabled(session.tenantId, 'PACKAGING');

  return (
    <EmpaqueLayoutClient>
      {children}
    </EmpaqueLayoutClient>
  );
}
