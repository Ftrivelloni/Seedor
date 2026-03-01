import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

type TaskNotification = {
  description: string;
  taskType: string;
  dueDate: string;
  lotDisplay: string;
};

type NotifyWorkersInput = {
  workers: Array<{ id: string; phone?: string | null }>;
  tasks: TaskNotification[];
};

const TELEGRAM_ENV_PATH = path.join(process.cwd(), 'telegram-bot', '.env');
const TELEGRAM_SESSIONS_PATH = path.join(
  process.cwd(),
  'telegram-bot',
  'data',
  'sessions.json'
);
const TELEGRAM_NOTIFICATIONS_PATH = path.join(
  process.cwd(),
  'telegram-bot',
  'data',
  'notifications_queue.json'
);

function parseDotEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equals = trimmed.indexOf('=');
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) result[key] = value;
  }
  return result;
}

async function loadTelegramBotToken(): Promise<string | null> {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }
  try {
    const content = await readFile(TELEGRAM_ENV_PATH, 'utf-8');
    const env = parseDotEnv(content);
    return env.TELEGRAM_BOT_TOKEN || null;
  } catch {
    return null;
  }
}

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[()\s-]/g, '');
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('+549') && cleaned.length > 6) {
    return `+54${cleaned.slice(4)}`;
  }
  return cleaned;
}

async function loadWorkerChatIds(): Promise<{
  byWorkerId: Map<string, string[]>;
  byPhone: Map<string, string[]>;
}> {
  try {
    const raw = await readFile(TELEGRAM_SESSIONS_PATH, 'utf-8');
    const data = JSON.parse(raw) as Record<string, string | { worker_id?: string; workerId?: string; phone?: string }>;
    const byWorkerId = new Map<string, string[]>();
    const byPhone = new Map<string, string[]>();

    for (const [chatId, workerId] of Object.entries(data)) {
      if (typeof workerId === 'string') {
        const current = byWorkerId.get(workerId) ?? [];
        if (!current.includes(chatId)) current.push(chatId);
        byWorkerId.set(workerId, current);
        continue;
      }

      if (workerId && typeof workerId === 'object') {
        const id = workerId.worker_id || workerId.workerId;
        const phone = workerId.phone;
        if (id) {
          const current = byWorkerId.get(id) ?? [];
          if (!current.includes(chatId)) current.push(chatId);
          byWorkerId.set(id, current);
        }
        if (phone) {
          const normalized = normalizePhone(phone);
          const current = byPhone.get(normalized) ?? [];
          if (!current.includes(chatId)) current.push(chatId);
          byPhone.set(normalized, current);
        }
      }
    }

    return { byWorkerId, byPhone };
  } catch {
    return { byWorkerId: new Map(), byPhone: new Map() };
  }
}

function buildTasksMessage(tasks: TaskNotification[]): string {
  if (tasks.length === 1) {
    const task = tasks[0];
    return [
      'Nueva tarea asignada',
      '',
      `Tarea: ${task.description}`,
      `Tipo: ${task.taskType}`,
      `Lote: ${task.lotDisplay}`,
      `Vence: ${task.dueDate}`,
    ].join('\n');
  }

  const lines = ['Nuevas tareas asignadas', ''];
  for (const task of tasks) {
    lines.push(`- ${task.description}`);
    lines.push(`  Tipo: ${task.taskType}`);
    lines.push(`  Lote: ${task.lotDisplay}`);
    lines.push(`  Vence: ${task.dueDate}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string
): Promise<boolean> {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.warn(
      `[Telegram] Failed to send message to chat_id=${chatId}: ${response.status} ${body}`
    );
    return false;
  }
  return true;
}

async function enqueueNotification(payload: {
  type: 'TASK_ASSIGNED';
  message: string;
  workers: Array<{ id: string; phone?: string | null }>;
  created_at: string;
}): Promise<void> {
  const dir = path.dirname(TELEGRAM_NOTIFICATIONS_PATH);
  await mkdir(dir, { recursive: true });

  let queue: { events: Array<typeof payload> } = { events: [] };
  try {
    const raw = await readFile(TELEGRAM_NOTIFICATIONS_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { events?: Array<typeof payload> };
    if (Array.isArray(parsed.events)) {
      queue = { events: parsed.events };
    }
  } catch {
    // Ignore malformed or missing file.
  }

  queue.events.push(payload);

  const tmpPath = `${TELEGRAM_NOTIFICATIONS_PATH}.tmp`;
  await writeFile(tmpPath, JSON.stringify(queue, null, 2));
  await rename(tmpPath, TELEGRAM_NOTIFICATIONS_PATH);
}

export async function notifyWorkersNewTasks({
  workers,
  tasks,
}: NotifyWorkersInput): Promise<void> {
  if (workers.length === 0 || tasks.length === 0) return;

  const message = buildTasksMessage(tasks);
  const createdAt = new Date().toISOString();

  const token = await loadTelegramBotToken();
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set. Skipping notifications.');
    await enqueueNotification({
      type: 'TASK_ASSIGNED',
      message,
      workers,
      created_at: createdAt,
    });
    return;
  }

  const workerChatIds = await loadWorkerChatIds();
  if (workerChatIds.byWorkerId.size === 0 && workerChatIds.byPhone.size === 0) {
    console.warn('[Telegram] No sessions found. Skipping notifications.');
    await enqueueNotification({
      type: 'TASK_ASSIGNED',
      message,
      workers,
      created_at: createdAt,
    });
    return;
  }

  const seenChatIds = new Set<string>();
  const pendingWorkers: Array<{ id: string; phone?: string | null }> = [];

  for (const worker of workers) {
    const chatIds = new Set<string>();
    const direct = workerChatIds.byWorkerId.get(worker.id);
    if (direct) {
      for (const chatId of direct) chatIds.add(chatId);
    }

    if (chatIds.size === 0 && worker.phone) {
      const byPhone = workerChatIds.byPhone.get(normalizePhone(worker.phone));
      if (byPhone) {
        for (const chatId of byPhone) chatIds.add(chatId);
      }
    }

    if (chatIds.size === 0) {
      pendingWorkers.push(worker);
      continue;
    }

    const results = await Promise.all(
      Array.from(chatIds).map(async (chatId) => {
        if (seenChatIds.has(chatId)) return true;
        seenChatIds.add(chatId);
        return sendTelegramMessage(token, chatId, message);
      })
    );

    if (!results.some(Boolean)) {
      pendingWorkers.push(worker);
    }
  }

  if (pendingWorkers.length > 0) {
    await enqueueNotification({
      type: 'TASK_ASSIGNED',
      message,
      workers: pendingWorkers,
      created_at: createdAt,
    });
  }
}
