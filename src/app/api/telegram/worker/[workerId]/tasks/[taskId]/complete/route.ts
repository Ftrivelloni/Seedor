import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
    isTelegramAuthorizedRequest,
    unauthorizedTelegramResponse,
} from '@/lib/telegram-auth';

/**
 * POST /api/telegram/worker/:workerId/tasks/:taskId/complete
 *
 * Granular endpoint to mark a single task as completed by a specific worker.
 * Protected by Telegram API key via isTelegramAuthorizedRequest().
 *
 * Body (optional):
 *   { "timestamp": "ISO8601", "source": "telegram" }
 *
 * Responses:
 *   200 - Success (includes already_completed for idempotency)
 *   400 - Invalid payload
 *   401 - Unauthorized
 *   404 - Worker or task not found
 *   409 - Worker not assigned to task or tenant mismatch
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ workerId: string; taskId: string }> }
) {
    // ── Auth ──
    if (!isTelegramAuthorizedRequest(request)) {
        return unauthorizedTelegramResponse();
    }

    const { workerId, taskId } = await params;

    if (!workerId || !taskId) {
        return NextResponse.json(
            { error: 'Missing workerId or taskId parameter' },
            { status: 400 }
        );
    }

    // Validate ID format (reasonable length)
    if (workerId.length > 256 || taskId.length > 256) {
        return NextResponse.json(
            { error: 'Invalid workerId or taskId format' },
            { status: 400 }
        );
    }

    // Parse optional body
    let timestamp: Date | undefined;
    let source = 'telegram';

    try {
        const text = await request.text();
        if (text.trim()) {
            const body = JSON.parse(text);
            if (body.timestamp) {
                timestamp = new Date(body.timestamp);
                if (isNaN(timestamp.getTime())) {
                    return NextResponse.json(
                        { error: `Invalid timestamp: ${body.timestamp}` },
                        { status: 400 }
                    );
                }
            }
            if (body.source && typeof body.source === 'string') {
                source = body.source;
            }
        }
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    const completedAt = timestamp ?? new Date();

    try {
        // Verify worker exists
        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            select: { id: true, tenantId: true },
        });

        if (!worker) {
            return NextResponse.json(
                { error: 'Worker not found' },
                { status: 404 }
            );
        }

        // Verify task exists
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                workerAssignments: { select: { workerId: true } },
                lotLinks: {
                    select: { lot: { select: { id: true, fieldId: true } } },
                },
            },
        });

        if (!task) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        // Idempotency: already completed
        if (task.status === 'COMPLETED') {
            return NextResponse.json({
                ok: true,
                already_completed: true,
                completed_at: task.completedAt?.toISOString(),
            });
        }

        // Tenant mismatch check
        if (worker.tenantId !== task.tenantId) {
            return NextResponse.json(
                { error: 'Worker and task belong to different tenants' },
                { status: 409 }
            );
        }

        // Assignment check
        const isAssigned = task.workerAssignments.some(
            (a) => a.workerId === workerId
        );

        if (!isAssigned) {
            return NextResponse.json(
                { error: 'Worker is not assigned to this task' },
                { status: 409 }
            );
        }

        // Complete the task in a transaction (idempotent: catch P2002 unique constraint)
        try {
            await prisma.$transaction([
                prisma.task.update({
                    where: { id: taskId },
                    data: {
                        status: 'COMPLETED',
                        completedAt,
                    },
                }),
                prisma.taskCompletionLog.create({
                    data: {
                        taskId,
                        workerId,
                        source,
                        completedAt,
                    },
                }),
            ]);
        } catch (txError: unknown) {
            // P2002 = unique constraint violation (duplicate completion)
            // Treat as success — task was already completed by this worker
            if (
                txError &&
                typeof txError === 'object' &&
                'code' in txError &&
                (txError as { code: string }).code === 'P2002'
            ) {
                return NextResponse.json({
                    ok: true,
                    already_completed: true,
                    completed_at: completedAt.toISOString(),
                });
            }
            throw txError;
        }

        // Revalidate cache
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

        return NextResponse.json({
            ok: true,
            already_completed: false,
            completed_at: completedAt.toISOString(),
        });
    } catch (error) {
        console.error('[Telegram Task Complete API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
