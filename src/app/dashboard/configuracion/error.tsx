'use client';

export default function ConfiguracionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h2 className="text-2xl font-semibold text-gray-900">Algo salió mal</h2>
      <p className="mt-2 text-sm text-gray-600">{error.message || 'Error desconocido'}</p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
