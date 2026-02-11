'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function CampoError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Campo Error Boundary]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Algo salió mal
                </h2>
                <p className="text-sm text-gray-500 mb-1">
                    Ocurrió un error al cargar la página de Campo.
                </p>
                <p className="text-xs text-gray-400 font-mono">
                    {error.message || 'Error desconocido'}
                </p>
            </div>
            <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors"
            >
                <RefreshCw className="h-4 w-4" />
                Reintentar
            </button>
        </div>
    );
}
