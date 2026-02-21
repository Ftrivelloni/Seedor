/**
 * Unit tests for Usuarios actions (inviteUserAction, resendInvitationAction,
 * revokeInvitationAction, updateUserRoleAction, updateUserStatusAction).
 * Tests validate input validation, auth boundary, and return value shape.
 *
 * Note: usuarios actions return ActionResult ({ success: true } | { success: false; error: string })
 * instead of throwing, except when an unexpected error occurs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock auth ──
vi.mock('@/lib/auth/auth', () => ({
    requireRole: vi.fn().mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1' }),
}));

// ── Mock revalidatePath ──
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// ── Mock Resend ──
const mockResendSend = vi.fn();
vi.mock('@/lib/resend', () => ({
    resend: { emails: { send: (...args: unknown[]) => mockResendSend(...args) } },
    EMAIL_FROM: 'noreply@seedor.app',
}));

// ── Mock email builder ──
vi.mock('@/lib/email/invitation-email', () => ({
    buildInvitationEmailHtml: vi.fn().mockReturnValue('<html>invite</html>'),
    buildInvitationEmailText: vi.fn().mockReturnValue('invite text'),
}));

// ── Mock Prisma ──
const mockUserFindUnique = vi.fn();
const mockUserFindUniqueOrThrow = vi.fn();
const mockUserUpdate = vi.fn();
const mockInvitationFindFirst = vi.fn();
const mockInvitationCreate = vi.fn();
const mockInvitationUpdate = vi.fn();
const mockTenantFindUniqueOrThrow = vi.fn();
const mockTenantUserMembershipFindFirst = vi.fn();

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
            findUniqueOrThrow: (...args: unknown[]) => mockUserFindUniqueOrThrow(...args),
            update: (...args: unknown[]) => mockUserUpdate(...args),
        },
        invitation: {
            findFirst: (...args: unknown[]) => mockInvitationFindFirst(...args),
            create: (...args: unknown[]) => mockInvitationCreate(...args),
            update: (...args: unknown[]) => mockInvitationUpdate(...args),
        },
        tenant: {
            findUniqueOrThrow: (...args: unknown[]) => mockTenantFindUniqueOrThrow(...args),
        },
        tenantUserMembership: {
            findFirst: (...args: unknown[]) => mockTenantUserMembershipFindFirst(...args),
        },
    },
}));

import {
    inviteUserAction,
    resendInvitationAction,
    revokeInvitationAction,
    updateUserRoleAction,
    updateUserStatusAction,
} from '@/app/dashboard/usuarios/actions';

// ── Helpers ──
function makeFormData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(entries)) {
        fd.set(key, value);
    }
    return fd;
}

// ══════════════ inviteUserAction ══════════════

describe('inviteUserAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserFindUnique.mockResolvedValue(null);
        mockInvitationFindFirst.mockResolvedValue(null);
        mockInvitationCreate.mockResolvedValue({ id: 'inv-1' });
        mockTenantFindUniqueOrThrow.mockResolvedValue({ name: 'Estancia Don Luis' });
        mockUserFindUniqueOrThrow.mockResolvedValue({ firstName: 'Admin', lastName: 'User' });
        mockResendSend.mockResolvedValue({ error: null });
    });

    it('returns error when email is empty', async () => {
        const fd = makeFormData({ email: '', role: 'SUPERVISOR' });
        const result = await inviteUserAction(fd);
        expect(result).toEqual({ success: false, error: 'El email es obligatorio para invitar un usuario.' });
    });

    it('returns error when role is invalid', async () => {
        const fd = makeFormData({ email: 'test@example.com', role: 'INVALID_ROLE' });
        const result = await inviteUserAction(fd);
        expect(result).toEqual({ success: false, error: 'Rol inválido.' });
    });

    it('returns error when user already belongs to tenant', async () => {
        mockUserFindUnique.mockResolvedValue({
            id: 'user-x',
            email: 'existing@example.com',
            memberships: { tenantId: 'tenant-1' },
        });
        const fd = makeFormData({ email: 'existing@example.com', role: 'SUPERVISOR' });
        const result = await inviteUserAction(fd);
        expect(result).toEqual({ success: false, error: 'Este usuario ya pertenece a tu organización.' });
    });

    it('returns error when user already exists in another tenant', async () => {
        mockUserFindUnique.mockResolvedValue({
            id: 'user-x',
            email: 'other@example.com',
            memberships: { tenantId: 'tenant-other' },
        });
        const fd = makeFormData({ email: 'other@example.com', role: 'SUPERVISOR' });
        const result = await inviteUserAction(fd);
        expect(result).toEqual({ success: false, error: 'Ya existe un usuario con ese email.' });
    });

    it('returns error when pending invitation already exists', async () => {
        mockInvitationFindFirst.mockResolvedValue({ id: 'inv-pending' });
        const fd = makeFormData({ email: 'newuser@example.com', role: 'SUPERVISOR' });
        const result = await inviteUserAction(fd);
        expect(result).toEqual({ success: false, error: 'Ya existe una invitación pendiente para este email.' });
    });

    it('succeeds with valid email and role SUPERVISOR', async () => {
        const fd = makeFormData({ email: 'nuevo@example.com', role: 'SUPERVISOR' });
        const result = await inviteUserAction(fd);
        expect(result).toEqual({ success: true });
        expect(mockInvitationCreate).toHaveBeenCalledOnce();
        expect(mockResendSend).toHaveBeenCalledOnce();
    });

    it('succeeds with valid email and role ADMIN', async () => {
        const fd = makeFormData({ email: 'newadmin@example.com', role: 'ADMIN' });
        const result = await inviteUserAction(fd);
        expect(result).toEqual({ success: true });
    });

    it('returns partial error when Resend API returns an error', async () => {
        mockResendSend.mockResolvedValue({ error: { message: 'API rate limit' } });
        const fd = makeFormData({ email: 'nuevo@example.com', role: 'SUPERVISOR' });
        const result = await inviteUserAction(fd);
        expect(result.success).toBe(false);
        expect((result as { success: false; error: string }).error).toContain('invitación fue creada');
    });

    it('returns partial error when Resend throws an exception', async () => {
        mockResendSend.mockRejectedValue(new Error('Network error'));
        const fd = makeFormData({ email: 'nuevo@example.com', role: 'SUPERVISOR' });
        const result = await inviteUserAction(fd);
        expect(result.success).toBe(false);
        expect((result as { success: false; error: string }).error).toContain('invitación fue creada');
    });
});

// ══════════════ resendInvitationAction ══════════════

describe('resendInvitationAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockInvitationFindFirst.mockResolvedValue({
            id: 'inv-1',
            email: 'user@example.com',
            role: 'SUPERVISOR',
            tenant: { name: 'Estancia Don Luis' },
            inviter: { firstName: 'Admin', lastName: 'User' },
        });
        mockInvitationUpdate.mockResolvedValue({});
        mockResendSend.mockResolvedValue({ error: null });
    });

    it('returns error when invitation is not found', async () => {
        mockInvitationFindFirst.mockResolvedValue(null);
        const result = await resendInvitationAction('nonexistent-id');
        expect(result).toEqual({ success: false, error: 'No se encontró la invitación o ya fue aceptada.' });
    });

    it('succeeds when invitation exists and email is sent', async () => {
        const result = await resendInvitationAction('inv-1');
        expect(result).toEqual({ success: true });
        expect(mockInvitationUpdate).toHaveBeenCalledOnce();
        expect(mockResendSend).toHaveBeenCalledOnce();
    });

    it('returns error when Resend API returns an error on resend', async () => {
        mockResendSend.mockResolvedValue({ error: { message: 'Rate limited' } });
        const result = await resendInvitationAction('inv-1');
        expect(result.success).toBe(false);
        expect((result as { success: false; error: string }).error).toContain('No se pudo enviar el email');
    });

    it('returns error when Resend throws on resend', async () => {
        mockResendSend.mockRejectedValue(new Error('timeout'));
        const result = await resendInvitationAction('inv-1');
        expect(result.success).toBe(false);
        expect((result as { success: false; error: string }).error).toContain('Error al enviar el email');
    });
});

// ══════════════ revokeInvitationAction ══════════════

describe('revokeInvitationAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockInvitationFindFirst.mockResolvedValue({ id: 'inv-1' });
        mockInvitationUpdate.mockResolvedValue({});
    });

    it('returns error when invitation is not found', async () => {
        mockInvitationFindFirst.mockResolvedValue(null);
        const result = await revokeInvitationAction('nonexistent-id');
        expect(result).toEqual({ success: false, error: 'No se encontró la invitación.' });
    });

    it('succeeds and sets status to REVOKED', async () => {
        const result = await revokeInvitationAction('inv-1');
        expect(result).toEqual({ success: true });
        expect(mockInvitationUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ data: { status: 'REVOKED' } })
        );
    });
});

// ══════════════ updateUserRoleAction ══════════════

describe('updateUserRoleAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTenantUserMembershipFindFirst.mockResolvedValue({ id: 'membership-1' });
        mockUserUpdate.mockResolvedValue({});
    });

    it('returns error when userId is empty', async () => {
        const fd = makeFormData({ userId: '', role: 'SUPERVISOR' });
        const result = await updateUserRoleAction(fd);
        expect(result).toEqual({ success: false, error: 'Datos inválidos para actualizar rol.' });
    });

    it('returns error when role is invalid', async () => {
        const fd = makeFormData({ userId: 'user-x', role: 'INVALID' });
        const result = await updateUserRoleAction(fd);
        expect(result).toEqual({ success: false, error: 'Datos inválidos para actualizar rol.' });
    });

    it('returns error when user does not belong to tenant', async () => {
        mockTenantUserMembershipFindFirst.mockResolvedValue(null);
        const fd = makeFormData({ userId: 'user-x', role: 'SUPERVISOR' });
        const result = await updateUserRoleAction(fd);
        expect(result).toEqual({ success: false, error: 'El usuario no pertenece al tenant activo.' });
    });

    it('succeeds updating role to ADMIN', async () => {
        const fd = makeFormData({ userId: 'user-x', role: 'ADMIN' });
        const result = await updateUserRoleAction(fd);
        expect(result).toEqual({ success: true });
        expect(mockUserUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ data: { role: 'ADMIN' } })
        );
    });

    it('succeeds updating role to SUPERVISOR', async () => {
        const fd = makeFormData({ userId: 'user-x', role: 'SUPERVISOR' });
        const result = await updateUserRoleAction(fd);
        expect(result).toEqual({ success: true });
    });
});

// ══════════════ updateUserStatusAction ══════════════

describe('updateUserStatusAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTenantUserMembershipFindFirst.mockResolvedValue({ id: 'membership-1' });
        mockUserUpdate.mockResolvedValue({});
    });

    it('returns error when userId is empty', async () => {
        const fd = makeFormData({ userId: '', status: 'ACTIVE' });
        const result = await updateUserStatusAction(fd);
        expect(result).toEqual({ success: false, error: 'Datos inválidos para actualizar estado.' });
    });

    it('returns error when status is invalid', async () => {
        const fd = makeFormData({ userId: 'user-x', status: 'BANNED' });
        const result = await updateUserStatusAction(fd);
        expect(result).toEqual({ success: false, error: 'Datos inválidos para actualizar estado.' });
    });

    it('returns error when user does not belong to tenant', async () => {
        mockTenantUserMembershipFindFirst.mockResolvedValue(null);
        const fd = makeFormData({ userId: 'user-x', status: 'ACTIVE' });
        const result = await updateUserStatusAction(fd);
        expect(result).toEqual({ success: false, error: 'El usuario no pertenece al tenant activo.' });
    });

    it('succeeds updating status to ACTIVE', async () => {
        const fd = makeFormData({ userId: 'user-x', status: 'ACTIVE' });
        const result = await updateUserStatusAction(fd);
        expect(result).toEqual({ success: true });
        expect(mockUserUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ data: { status: 'ACTIVE' } })
        );
    });

    it('succeeds updating status to INACTIVE', async () => {
        const fd = makeFormData({ userId: 'user-x', status: 'INACTIVE' });
        const result = await updateUserStatusAction(fd);
        expect(result).toEqual({ success: true });
    });

    it('succeeds updating status to INVITED', async () => {
        const fd = makeFormData({ userId: 'user-x', status: 'INVITED' });
        const result = await updateUserStatusAction(fd);
        expect(result).toEqual({ success: true });
    });
});
