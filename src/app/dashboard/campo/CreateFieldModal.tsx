'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { createFieldAction } from './actions';

export function CreateFieldModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createFieldAction(formData);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors"
      >
        <MapPin className="h-4 w-4" />
        Nuevo campo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Crear campo</h2>
            <p className="mt-1 text-sm text-gray-500">
              Registrá un nuevo campo para organizar tus lotes de producción.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="field-name" className="block text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="field-name"
                  name="name"
                  required
                  placeholder="Ej: Campo Norte"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="field-location" className="block text-sm font-medium text-gray-700">
                  Ubicación
                </label>
                <input
                  id="field-location"
                  name="location"
                  placeholder="Ej: Ruta 40 Km 120"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="field-description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <input
                  id="field-description"
                  name="description"
                  placeholder="Descripción general del campo"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Creando...' : 'Crear campo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
