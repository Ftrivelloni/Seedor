import { Suspense } from 'react';
import { requireRole } from '@/lib/auth/auth';
import { requireModuleEnabled } from '@/lib/auth/module-access';
import VentasPageClient from './VentasPageClient';

export const dynamic = 'force-dynamic';

export default async function VentasPage() {
  const session = await requireRole(['ADMIN']);
  await requireModuleEnabled(session.tenantId, 'SALES');

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VentasPageClient />
    </Suspense>
  );
}
