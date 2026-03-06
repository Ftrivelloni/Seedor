import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    isTelegramAuthorizedRequest,
    unauthorizedTelegramResponse,
} from '@/lib/telegram-auth';

/**
 * GET /api/telegram/worker/:workerId/tasks
 *
 * Returns active (non-completed) tasks assigned to this specific worker.
 * Includes lot and field info for display. Protected by API key.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ workerId: string }> }
) {
    // ── Auth ──
    if (!isTelegramAuthorizedRequest(request)) {
        return unauthorizedTelegramResponse();
    }

    const { workerId } = await params;

    if (!workerId) {
        return NextResponse.json(
            { error: 'Missing workerId parameter' },
            { status: 400 }
        );
    }

    try {
        // Verify worker exists
        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            select: { id: true, tenantId: true, firstName: true, lastName: true },
        });

        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
        }

        // Find active (non-completed) tasks assigned to this worker
        const assignments = await prisma.taskAssignment.findMany({
            where: {
                workerId,
                task: {
                    status: { not: 'COMPLETED' },
                },
            },
            select: {
                task: {
                    select: {
                        id: true,
                        description: true,
                        taskType: true,
                        status: true,
                        startDate: true,
                        dueDate: true,
                        tenantId: true,
                        lotLinks: {
                            select: {
                                lot: {
                                    select: {
                                        id: true,
                                        name: true,
                                        field: {
                                            select: { id: true, name: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const tasks = assignments
            .map((a) => a.task)
            .map((t) => ({
                id: t.id,
                description: t.description,
                task_type: t.taskType,
                status: t.status,
                start_date: t.startDate.toISOString().split('T')[0],
                due_date: t.dueDate.toISOString().split('T')[0],
                tenant_id: t.tenantId,
                lots: t.lotLinks.map((l) => ({
                    id: l.lot.id,
                    name: l.lot.name,
                    field_name: l.lot.field.name,
                })),
            }));

        return NextResponse.json({
            worker_id: worker.id,
            worker_name: `${worker.firstName} ${worker.lastName}`,
            tenant_id: worker.tenantId,
            tasks,
        });
    } catch (error) {
        console.error('[Telegram Worker Tasks API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
