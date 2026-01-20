import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12">
      <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}
