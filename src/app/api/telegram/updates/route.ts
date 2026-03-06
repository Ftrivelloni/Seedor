import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
    isTelegramAuthorizedRequest,
    unauthorizedTelegramResponse,
} from '@/lib/telegram-auth';

interface TelegramEvent {
    type: 'TASK_COMPLETED';
    worker_id: string;
    task_id?: string;
    timestamp: string;
}

/**
 * POST /api/telegram/updates
 *
 * Receives events from the Telegram bot (task completions)
 * and applies them to the database. Protected by API key.
 */
export async function POST(request: Request) {
    // ── Auth ──
    if (!isTelegramAuthorizedRequest(request)) {
        return unauthorizedTelegramResponse();
    }

    try {
        const body = (await request.json()) as { events?: TelegramEvent[] };
        const events = body.events;

        if (!events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json(
                { error: 'No events provided' },
                { status: 400 }
            );
        }

        let processed = 0;
        const errors: string[] = [];

        for (const event of events) {
            try {
                // A.1: explicitly reject unsupported event types
                if (event.type !== 'TASK_COMPLETED') {
                    errors.push(
                        `Unsupported event type: "${event.type}" — only TASK_COMPLETED is supported`
                    );
                    console.warn(
                        `[Telegram Updates API] Unsupported event type: "${event.type}"`
                    );
                    continue;
                }

                if (event.type === 'TASK_COMPLETED' && event.task_id) {
                    // Sanitize IDs: must be non-empty strings within reasonable length
                    if (
                        typeof event.task_id !== 'string' ||
                        event.task_id.trim().length === 0 ||
                        event.task_id.length > 256 ||
                        typeof event.worker_id !== 'string' ||
                        event.worker_id.trim().length === 0 ||
                        event.worker_id.length > 256
                    ) {
                        errors.push('Invalid task_id or worker_id format');
                        continue;
                    }

                    // Verify the task exists and the worker is assigned
                    const task = await prisma.task.findUnique({
                        where: { id: event.task_id },
                        include: {
                            workerAssignments: { select: { workerId: true } },
                            lotLinks: {
                                select: { lot: { select: { id: true, fieldId: true } } },
                            },
                        },
                    });

                    if (!task) {
                        errors.push(`Task ${event.task_id} not found`);
                        continue;
                    }

                    if (task.status === 'COMPLETED') {
                        processed++;
                        continue;
                    }

                    // Cross-tenant check: verify worker belongs to the same tenant as the task
                    const workerInTenant = await prisma.worker.findFirst({
                        where: { id: event.worker_id, tenantId: task.tenantId },
                        select: { id: true },
                    });

                    if (!workerInTenant) {
                        errors.push(
                            `Worker ${event.worker_id} not found in tenant for task ${event.task_id}`
                        );
                        continue;
                    }

                    const isAssigned = task.workerAssignments.some(
                        (a) => a.workerId === event.worker_id
                    );

                    if (!isAssigned) {
                        errors.push(
                            `Worker ${event.worker_id} not assigned to task ${event.task_id}`
                        );
                        continue;
                    }

                    const rawTimestamp = event.timestamp;
                    const completedAt = typeof rawTimestamp === 'string' && rawTimestamp
                        ? new Date(rawTimestamp)
                        : new Date(NaN);
                    if (isNaN(completedAt.getTime())) {
                        errors.push(
                            `Invalid timestamp "${rawTimestamp}" (type: ${typeof rawTimestamp}) for event on task ${event.task_id}`
                        );
                        continue;
                    }

                    // Idempotent write: catch P2002 (unique constraint) as success
                    try {
                        await prisma.$transaction([
                            prisma.task.update({
                                where: { id: event.task_id },
                                data: {
                                    status: 'COMPLETED',
                                    completedAt,
                                },
                            }),
                            prisma.taskCompletionLog.create({
                                data: {
                                    taskId: event.task_id,
                                    workerId: event.worker_id,
                                    source: 'telegram',
                                    completedAt,
                                },
                            }),
                        ]);
                    } catch (txError: unknown) {
                        if (
                            txError &&
                            typeof txError === 'object' &&
                            'code' in txError &&
                            (txError as { code: string }).code === 'P2002'
                        ) {
                            // Duplicate completion — treat as already completed
                            processed++;
                            continue;
                        }
                        throw txError;
                    }

                    revalidatePath('/dashboard');
                    revalidatePath('/dashboard/campo');

                    const paths = new Set<string>();
                    for (const link of task.lotLinks) {
                        paths.add(`/dashboard/campo/${link.lot.fieldId}`);
                        paths.add(`/dashboard/campo/${link.lot.fieldId}/${link.lot.id}`);
                    }
                    for (const path of paths) {
                        revalidatePath(path);
                    }

                    processed++;
                }
            } catch (eventError) {
                const msg =
                    eventError instanceof Error ? eventError.message : String(eventError);
                errors.push(`Event ${event.type}: ${msg}`);
            }
        }

        return NextResponse.json({
            processed,
            total: events.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('[Telegram Updates API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
