import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    isTelegramAuthorizedRequest,
    unauthorizedTelegramResponse,
} from '@/lib/telegram-auth';

/**
 * GET /api/telegram/tenant/:tenantId/inventory/items
 *
 * Returns inventory items with current stock levels for a tenant.
 * Protected by API key.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    // ── Auth ──
    if (!isTelegramAuthorizedRequest(request)) {
        return unauthorizedTelegramResponse();
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

        const items = await prisma.inventoryItem.findMany({
            where: { tenantId },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                unit: true,
                stocks: {
                    select: {
                        quantity: true,
                        lowThreshold: true,
                        criticalThreshold: true,
                        warehouse: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            items: items.map((item) => ({
                id: item.id,
                code: item.code,
                name: item.name,
                description: item.description,
                unit: item.unit,
                stocks: item.stocks.map((s) => ({
                    warehouse_id: s.warehouse.id,
                    warehouse_name: s.warehouse.name,
                    quantity: s.quantity,
                    low_threshold: s.lowThreshold,
                    critical_threshold: s.criticalThreshold,
                })),
                total_stock: item.stocks.reduce((sum, s) => sum + s.quantity, 0),
            })),
        });
    } catch (error) {
        console.error('[Telegram Inventory API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
