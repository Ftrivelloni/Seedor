import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { InviteUserModal } from './InviteUserModal';
import { UsersTable } from './UsersTable';
import { PendingInvitations } from './PendingInvitations';
import { Search, Download, Settings } from 'lucide-react';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const session = await requireRole(['ADMIN']);
  const params = await searchParams;

  const users = await prisma.tenantUserMembership.findMany({
    where: { tenantId: session.tenantId },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  // Wrapped in try/catch so the page still works if the Invitation table
  // has not been migrated yet (avoids 500 on first deploy).
  type InvitationWithInviter = Awaited<
    ReturnType<typeof prisma.invitation.findMany<{
      include: { inviter: { select: { firstName: true; lastName: true } } };
    }>>
  >;
  let pendingInvitations: InvitationWithInviter = [];
  try {
    pendingInvitations = await prisma.invitation.findMany({
      where: {
        tenantId: session.tenantId,
        status: 'PENDING',
      },
      include: {
        inviter: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // Table may not exist yet — silently ignore
  }

  // Filter users based on search params
  let filteredUsers = users;

  if (params.q) {
    const query = params.q.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (entry) =>
        entry.user.firstName.toLowerCase().includes(query) ||
        entry.user.lastName.toLowerCase().includes(query) ||
        entry.user.email.toLowerCase().includes(query) ||
        entry.user.phone.includes(query)
    );
  }

  if (params.role && params.role !== 'ALL') {
    filteredUsers = filteredUsers.filter(
      (entry) => entry.user.role === params.role
    );
  }

  if (params.status && params.status !== 'ALL') {
    filteredUsers = filteredUsers.filter(
      (entry) => entry.user.status === params.status
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <header className="space-y-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="text-xs md:text-sm text-gray-600">
            Administrá accesos y permisos de tu empresa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2 hidden md:flex" disabled>
            <Settings className="h-4 w-4" />
            Roles y permisos
          </Button>
          <InviteUserModal />
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <form className="relative flex-1" action="/dashboard/usuarios">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="q"
            type="search"
            placeholder="Buscar por nombre, email o teléfono..."
            defaultValue={params.q || ''}
            className="pl-10 bg-white! border-gray-300"
          />
          <input type="hidden" name="role" value={params.role || 'ALL'} />
          <input type="hidden" name="status" value={params.status || 'ALL'} />
        </form>

        <form className="flex flex-wrap items-center gap-2" action="/dashboard/usuarios">
          <input type="hidden" name="q" value={params.q || ''} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">Filtrado por rol</label>
            <Select name="role" defaultValue={params.role || 'ALL'}>
              <SelectTrigger className="w-full sm:w-40 bg-white! border-gray-300 cursor-pointer">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5} className="w-(--radix-select-trigger-width) bg-white! border-gray-300">
                <SelectItem value="ALL">Todos los roles</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">Filtrado por estado</label>
            <Select name="status" defaultValue={params.status || 'ALL'}>
              <SelectTrigger className="w-full sm:w-35 bg-white! border-gray-300 cursor-pointer">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5} className="w-(--radix-select-trigger-width) bg-white! border-gray-300">
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                <SelectItem value="INVITED">Invitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" variant="ghost" size="sm" className="hidden">
            Filtrar
          </Button>

          <Button variant="outline" className="gap-2 hidden md:flex" disabled>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </form>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <PendingInvitations invitations={pendingInvitations} />
      )}

      {/* Users Table */}
      <UsersTable users={filteredUsers} />
    </div>
  );
}
