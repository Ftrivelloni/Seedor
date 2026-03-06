'use client';

import type { User, TenantUserMembership } from '@prisma/client';
import { formatRelativeTime } from '@/lib/utils/format-relative-time';
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu';
import { MoreHorizontal, UserCog, UserX, UserCheck, Trash2 } from 'lucide-react';
import { updateUserRoleAction, updateUserStatusAction } from './actions';

type UserWithMembership = TenantUserMembership & {
    user: User;
};

interface UsersTableProps {
    users: UserWithMembership[];
}

function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
    if (role === 'ADMIN') {
        return (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                Administrador
            </Badge>
        );
    }
    return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
            Encargado
        </Badge>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'ACTIVE') {
        return (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                Activo
            </Badge>
        );
    }
    if (status === 'INVITED') {
        return (
            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">
                Invitado
            </Badge>
        );
    }
    return (
        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0">
            Inactivo
        </Badge>
    );
}

function UserActionsMenu({
    user,
}: {
    user: User;
}) {
    async function handleRoleChange(role: 'ADMIN' | 'SUPERVISOR') {
        const formData = new FormData();
        formData.set('userId', user.id);
        formData.set('role', role);
        await updateUserRoleAction(formData);
    }

    async function handleStatusChange(status: 'ACTIVE' | 'INACTIVE') {
        const formData = new FormData();
        formData.set('userId', user.id);
        formData.set('status', status);
        await updateUserStatusAction(formData);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Acciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() =>
                        handleRoleChange(user.role === 'ADMIN' ? 'SUPERVISOR' : 'ADMIN')
                    }
                >
                    <UserCog className="mr-2 h-4 w-4" />
                    Cambiar a {user.role === 'ADMIN' ? 'Supervisor' : 'Administrador'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.status === 'ACTIVE' ? (
                    <DropdownMenuItem onClick={() => handleStatusChange('INACTIVE')}>
                        <UserX className="mr-2 h-4 w-4" />
                        Desactivar usuario
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activar usuario
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" disabled>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar usuario
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function UsersTable({ users }: UsersTableProps) {
    if (users.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
        );
    }

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="whitespace-nowrap px-3 md:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Usuario
                            </th>
                            <th className="whitespace-nowrap px-3 md:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden sm:table-cell">
                                Teléfono
                            </th>
                            <th className="whitespace-nowrap px-3 md:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Rol
                            </th>
                            <th className="whitespace-nowrap px-3 md:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">
                                Último acceso
                            </th>
                            <th className="whitespace-nowrap px-3 md:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Estado
                            </th>
                            <th className="whitespace-nowrap px-3 md:px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {users.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-3 md:px-4 py-3">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <Avatar className="h-8 w-8 md:h-9 md:w-9 bg-green-100 text-green-700 flex-shrink-0">
                                            <AvatarFallback className="bg-green-100 text-green-700 text-xs md:text-sm font-medium">
                                                {getInitials(entry.user.firstName, entry.user.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                                                {entry.user.firstName} {entry.user.lastName}
                                            </p>
                                            <p className="text-xs md:text-sm text-gray-500 truncate">{entry.user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 md:px-4 py-3 text-xs md:text-sm text-gray-700 hidden sm:table-cell">
                                    {entry.user.phone || '-'}
                                </td>
                                <td className="px-3 md:px-4 py-3">
                                    <RoleBadge role={entry.user.role} />
                                </td>
                                <td className="whitespace-nowrap px-3 md:px-4 py-3 text-xs md:text-sm text-gray-700 hidden md:table-cell">
                                    {formatRelativeTime(entry.user.lastAccessAt)}
                                </td>
                                <td className="px-3 md:px-4 py-3">
                                    <StatusBadge status={entry.user.status} />
                                </td>
                                <td className="px-3 md:px-4 py-3 text-right">
                                    <UserActionsMenu user={entry.user} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
