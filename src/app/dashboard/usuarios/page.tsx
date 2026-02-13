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

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const session = await requireRole(['ADMIN']);
  const params = await searchParams;

  const [users, pendingInvitations] = await Promise.all([
    prisma.tenantUserMembership.findMany({
      where: { tenantId: session.tenantId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invitation.findMany({
      where: {
        tenantId: session.tenantId,
        status: 'PENDING',
      },
      include: {
        inviter: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-600">
            Administrá accesos y permisos de tu empresa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" disabled>
            <Settings className="h-4 w-4" />
            Roles y permisos
          </Button>
          <InviteUserModal />
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <form className="relative flex-1" action="/dashboard/usuarios">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="q"
            type="search"
            placeholder="Buscar por nombre, email o teléfono..."
            defaultValue={params.q || ''}
            className="pl-10"
          />
          <input type="hidden" name="role" value={params.role || 'ALL'} />
          <input type="hidden" name="status" value={params.status || 'ALL'} />
        </form>

        <form className="flex items-center gap-3" action="/dashboard/usuarios">
          <input type="hidden" name="q" value={params.q || ''} />
          <Select name="role" defaultValue={params.role || 'ALL'}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los roles</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
            </SelectContent>
          </Select>

          <Select name="status" defaultValue={params.status || 'ALL'}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="INACTIVE">Inactivo</SelectItem>
              <SelectItem value="INVITED">Invitado</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit" variant="ghost" size="sm" className="hidden">
            Filtrar
          </Button>
        </form>

        <Button variant="outline" className="gap-2" disabled>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
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
