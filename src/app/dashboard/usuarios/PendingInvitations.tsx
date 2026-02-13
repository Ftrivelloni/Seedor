'use client';

import type { Invitation, User } from '@prisma/client';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu';
import { Clock, Mail, MoreHorizontal, RefreshCw, XCircle } from 'lucide-react';
import { resendInvitationAction, revokeInvitationAction } from './actions';

type InvitationWithInviter = Invitation & {
  inviter: Pick<User, 'firstName' | 'lastName'>;
};

interface PendingInvitationsProps {
  invitations: InvitationWithInviter[];
}

function formatTimeLeft(expiresAt: Date): string {
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  if (diff <= 0) return 'Expirada';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h restantes`;
  return `${hours}h restantes`;
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  async function handleResend(invitationId: string) {
    const result = await resendInvitationAction(invitationId);
    if (!result.success) {
      console.error('Error resending invitation:', result.error);
    }
  }

  async function handleRevoke(invitationId: string) {
    const result = await revokeInvitationAction(invitationId);
    if (!result.success) {
      console.error('Error revoking invitation:', result.error);
    }
  }

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-yellow-600" />
        <h3 className="text-sm font-semibold text-yellow-800">
          Invitaciones pendientes ({invitations.length})
        </h3>
      </div>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <Mail className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {invitation.email}
                </p>
                <p className="text-xs text-gray-500">
                  Invitado por {invitation.inviter.firstName}{' '}
                  {invitation.inviter.lastName} ·{' '}
                  {formatTimeLeft(invitation.expiresAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  invitation.role === 'ADMIN'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-0'
                    : 'bg-green-100 text-green-700 hover:bg-green-100 border-0'
                }
              >
                {invitation.role === 'ADMIN' ? 'Admin' : 'Operativo'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleResend(invitation.id)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reenviar invitación
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRevoke(invitation.id)}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Revocar invitación
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
