import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TelegramEvent {
    type: 'TASK_COMPLETED' | 'ATTENDANCE';
    worker_id: string;
    task_id?: string;
    timestamp: string;
    latitude?: number;
    longitude?: number;
}

/**
 * POST /api/telegram/updates
 *
 * Receives events from the Telegram bot (task completions, attendance)
 * and applies them to the database. Protected by API key.
 */
export async function POST(request: Request) {
    // ── Auth ──
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.TELEGRAM_SYNC_API_KEY;

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
                if (event.type === 'TASK_COMPLETED' && event.task_id) {
                    // Verify the task exists and the worker is assigned
                    const task = await prisma.task.findUnique({
                        where: { id: event.task_id },
                        include: {
                            workerAssignments: { select: { workerId: true } },
                        },
                    });

                    if (!task) {
                        errors.push(`Task ${event.task_id} not found`);
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

                    await prisma.task.update({
                        where: { id: event.task_id },
                        data: {
                            status: 'COMPLETED',
                            completedAt: new Date(event.timestamp),
                        },
                    });

                    processed++;
                } else if (event.type === 'ATTENDANCE') {
                    // Log attendance — for now we just log it.
                    // In the future this could write to an Attendance model.
                    console.log(
                        `[Telegram] Attendance: worker=${event.worker_id} ` +
                        `lat=${event.latitude} lon=${event.longitude} ` +
                        `at=${event.timestamp}`
                    );
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
