/**
 * Formats a date as relative time in Spanish
 * e.g., "Hace 2h", "Hace 3 días", "25/01/2026"
 */
export function formatRelativeTime(date: Date | null | undefined): string {
    if (!date) return 'Sin acceso';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
        return 'Hace un momento';
    }

    if (diffMinutes < 60) {
        return `Hace ${diffMinutes}m`;
    }

    if (diffHours < 24) {
        return `Hace ${diffHours}h`;
    }

    if (diffDays < 7) {
        return diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`;
    }

    // For dates older than 7 days, show the actual date
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
