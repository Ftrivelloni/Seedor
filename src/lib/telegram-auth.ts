import { NextResponse } from 'next/server';

const TELEGRAM_AUTH_ENV_VARS = ['TELEGRAM_SYNC_API_KEY', 'SEEDOR_API_KEY'] as const;

function parseKeyList(raw: string): string[] {
    return raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

export function getTelegramApiKeys(): string[] {
    const keys = TELEGRAM_AUTH_ENV_VARS.flatMap((envName) => {
        const raw = process.env[envName] ?? '';
        return raw ? parseKeyList(raw) : [];
    });
    return Array.from(new Set(keys));
}

export function isTelegramAuthorizedRequest(request: Request): boolean {
    const keys = getTelegramApiKeys();
    if (!keys.length) {
        return false;
    }

    const authHeader = request.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
        return false;
    }

    const providedKey = authHeader.slice('Bearer '.length).trim();
    if (!providedKey) {
        return false;
    }

    return keys.includes(providedKey);
}

export function unauthorizedTelegramResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
