import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/tenant/:tenantId/team
 *
 * Returns all workers for a tenant. Protected by API key.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    // ── Auth ──
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.TELEGRAM_SYNC_API_KEY;

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    if (!tenantId) {
        return NextResponse.json(
            { error: 'Missing tenantId parameter' },
            { status: 400 }
        );
    }

    try {
        // Verify tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const workers = await prisma.worker.findMany({
            where: { tenantId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                functionType: true,
                active: true,
            },
            orderBy: [{ active: 'desc' }, { lastName: 'asc' }],
        });

        return NextResponse.json({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            workers: workers.map((w) => ({
                id: w.id,
                first_name: w.firstName,
                last_name: w.lastName,
                phone: w.phone,
                function_type: w.functionType,
                active: w.active,
            })),
        });
    } catch (error) {
        console.error('[Telegram Team API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
