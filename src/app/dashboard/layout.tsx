import { AppLayout } from '@/components/dashboard/AppLayout';
import { requireAuthSession } from '@/lib/auth/auth';
import { Toaster } from '@/components/dashboard/ui/sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuthSession();

  return (
    <AppLayout
      user={{
        firstName: session.firstName,
        lastName: session.lastName,
        role: session.role,
      }}
    >
      {children}
      <Toaster />
    </AppLayout>
  );
}
