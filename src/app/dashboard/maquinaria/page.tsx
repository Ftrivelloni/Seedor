import { requireAuthSession } from '@/lib/auth/auth';
import { requireModuleEnabled } from '@/lib/auth/module-access';
import MaquinariaPageClient from './MaquinariaPageClient';

export default async function MaquinariaPage() {
  const session = await requireAuthSession();
  await requireModuleEnabled(session.tenantId, 'MACHINERY');

  return <MaquinariaPageClient />;
}
