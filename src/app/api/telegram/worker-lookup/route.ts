import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/worker-lookup?phone=+5491234567
 *
 * Looks up a worker by phone number across ALL tenants.
 * Returns all matching workers with their tenant info.
 * Protected by API key.
 */
export async function GET(request: Request) {
    // ── Auth ──
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.TELEGRAM_SYNC_API_KEY;

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Phone param ──
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone) {
        return NextResponse.json(
            { error: 'Missing required query parameter: phone' },
            { status: 400 }
        );
    }

    // Normalize phone: strip spaces/dashes/parens, ensure leading +, remove Argentine 9
    let phone = rawPhone.replace(/[\s\-()]/g, '');
    if (!phone.startsWith('+')) phone = `+${phone}`;
    if (phone.startsWith('+549') && phone.length > 6) {
        phone = `+54${phone.slice(4)}`;
    }

    try {
        // Search for workers matching phone across all tenants
        // We search both with and without the Argentine 9 prefix
        const phoneVariants = [phone];
        if (phone.startsWith('+54') && !phone.startsWith('+549')) {
            phoneVariants.push(`+549${phone.slice(3)}`);
        } else if (phone.startsWith('+549')) {
            phoneVariants.push(`+54${phone.slice(4)}`);
        }

        const workers = await prisma.worker.findMany({
            where: {
                active: true,
                OR: phoneVariants.map((p) => ({ phone: p })),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                tenantId: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            workers: workers.map((w) => ({
                worker_id: w.id,
                first_name: w.firstName,
                last_name: w.lastName,
                phone: w.phone,
                tenant_id: w.tenant.id,
                tenant_name: w.tenant.name,
            })),
        });
    } catch (error) {
        console.error('[Telegram Worker Lookup API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
