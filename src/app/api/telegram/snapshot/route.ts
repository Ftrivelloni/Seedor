import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/snapshot?tenantId=xxx
 *
 * Returns a read-only snapshot of workers, fields/lots, and active tasks
 * for the Telegram bot sync service. Protected by API key.
 */
export async function GET(request: Request) {
    // ── Auth ──
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.TELEGRAM_SYNC_API_KEY;

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Tenant ID ──
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json(
            { error: 'Missing required query parameter: tenantId' },
            { status: 400 }
        );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
    });

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    try {
        // ── Fetch data in parallel ──
        const [workers, fields, tasks] = await Promise.all([
            // Active workers with phone numbers
            prisma.worker.findMany({
                where: { tenantId, active: true },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    functionType: true,
                    active: true,
                },
                orderBy: { lastName: 'asc' },
            }),

            // Fields with lots
            prisma.field.findMany({
                where: { tenantId },
                include: {
                    lots: {
                        select: {
                            id: true,
                            name: true,
                            areaHectares: true,
                            productionType: true,
                        },
                        orderBy: { name: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            }),

            // Active tasks (non-completed) with assignments and lot links
            prisma.task.findMany({
                where: {
                    tenantId,
                    status: { not: 'COMPLETED' },
                },
                include: {
                    workerAssignments: {
                        select: { workerId: true },
                    },
                    lotLinks: {
                        select: { lotId: true },
                    },
                },
                orderBy: { dueDate: 'asc' },
            }),
        ]);

        // ── Transform to snapshot schema ──
        const snapshot = {
            generated_at: new Date().toISOString(),
            tenant: { id: tenant.id, name: tenant.name },
            workers: workers.map((w) => ({
                id: w.id,
                first_name: w.firstName,
                last_name: w.lastName,
                phone: w.phone,
                function_type: w.functionType,
                active: w.active,
            })),
            fields: fields.map((f) => ({
                id: f.id,
                name: f.name,
                location: f.location,
                lots: f.lots.map((l) => ({
                    id: l.id,
                    name: l.name,
                    area_hectares: l.areaHectares,
                    production_type: l.productionType,
                })),
            })),
            tasks: tasks.map((t) => ({
                id: t.id,
                description: t.description,
                task_type: t.taskType,
                status: t.status,
                start_date: t.startDate.toISOString().split('T')[0],
                due_date: t.dueDate.toISOString().split('T')[0],
                assigned_worker_ids: t.workerAssignments.map((a) => a.workerId),
                lot_ids: t.lotLinks.map((l) => l.lotId),
            })),
        };

        return NextResponse.json(snapshot);
    } catch (error) {
        console.error('[Telegram Snapshot API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
