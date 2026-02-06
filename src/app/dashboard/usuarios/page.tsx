import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import {
  inviteUserAction,
  updateUserRoleAction,
  updateUserStatusAction,
} from '@/app/dashboard/usuarios/actions';

export default async function UsuariosPage() {
  const session = await requireRole(['ADMIN']);

  const users = await prisma.tenantUserMembership.findMany({
    where: {
      tenantId: session.tenantId,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-600">
          Gestión de usuarios del tenant: invitación, roles y estado de acceso.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Invitar usuario</h2>
        <p className="mt-1 text-sm text-gray-600">
          Se crea el usuario en estado invitado y queda listo para integración de envío externo.
        </p>

        <form action={inviteUserAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="firstName"
            required
            placeholder="Nombre"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          <input
            name="lastName"
            required
            placeholder="Apellido"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          <input
            name="phone"
            required
            placeholder="Teléfono"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          <div className="flex gap-2">
            <select
              name="role"
              defaultValue="SUPERVISOR"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            >
              <option value="SUPERVISOR">Supervisor operativo</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Invitar
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Último acceso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {entry.user.firstName} {entry.user.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.user.phone}</td>
                  <td className="px-4 py-3">
                    <form action={updateUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={entry.user.id} />
                      <select
                        name="role"
                        defaultValue={entry.user.role}
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                      >
                        <option value="ADMIN">Administrador</option>
                        <option value="SUPERVISOR">Supervisor</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-100"
                      >
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {entry.user.lastAccessAt
                      ? entry.user.lastAccessAt.toLocaleString('es-AR')
                      : 'Sin acceso'}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateUserStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={entry.user.id} />
                      <select
                        name="status"
                        defaultValue={entry.user.status}
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                      >
                        <option value="INVITED">Invitado</option>
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-100"
                      >
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
