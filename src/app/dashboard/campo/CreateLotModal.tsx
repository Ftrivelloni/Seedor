'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { createLotAction } from './actions';
import type { SerializedCropType } from './types';

interface CreateLotModalProps {
  fieldId: string;
  fieldName: string;
  cropTypes: SerializedCropType[];
}

export function CreateLotModal({ fieldId, fieldName, cropTypes }: CreateLotModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleCrop(cropId: string) {
    setSelectedCrops((prev) =>
      prev.includes(cropId) ? prev.filter((c) => c !== cropId) : [...prev, cropId]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    // Append each selected crop type ID
    selectedCrops.forEach((id) => formData.append('cropTypeIds', id));
    startTransition(async () => {
      try {
        await createLotAction(formData);
        setOpen(false);
        setSelectedCrops([]);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear el lote.');
      }
    });
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) setError(null);
  }

  return (
    <>
      <button
        onClick={() => handleOpenChange(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nuevo lote
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => handleOpenChange(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900">Crear lote</h2>
            <p className="mt-1 text-sm text-gray-500">
              Agregá un nuevo lote al campo &quot;{fieldName}&quot;.
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <input type="hidden" name="fieldId" value={fieldId} />

              <div className="space-y-1.5">
                <label htmlFor="lot-name" className="block text-sm font-medium text-gray-700">
                  Nombre del lote <span className="text-red-500">*</span>
                </label>
                <input
                  id="lot-name"
                  name="name"
                  required
                  maxLength={100}
                  placeholder="Ej: Lote A1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="lot-hectares" className="block text-sm font-medium text-gray-700">
                  Hectáreas <span className="text-red-500">*</span>
                </label>
                <input
                  id="lot-hectares"
                  name="areaHectares"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="Ej: 25.5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="lot-production" className="block text-sm font-medium text-gray-700">
                  Tipo de producción <span className="text-red-500">*</span>
                </label>
                <input
                  id="lot-production"
                  name="productionType"
                  required
                  placeholder="Ej: Limones, Naranjas, Arándanos..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              {/* Crop Types multi-select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Tipos de cultivo
                </label>
                {cropTypes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No hay tipos de cultivo creados. Crealos desde el módulo Campo.
                  </p>
                ) : (
                  <>
                    {/* Selected chips */}
                    {selectedCrops.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedCrops.map((id) => {
                          const ct = cropTypes.find((c) => c.id === id);
                          if (!ct) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                              style={{ backgroundColor: ct.color }}
                            >
                              {ct.name}
                              <button
                                type="button"
                                onClick={() => toggleCrop(id)}
                                className="hover:opacity-80"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {cropTypes
                        .filter((ct) => !selectedCrops.includes(ct.id))
                        .map((ct) => (
                          <button
                            key={ct.id}
                            type="button"
                            onClick={() => toggleCrop(ct.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: ct.color }}
                            />
                            {ct.name}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="lot-fruits" className="block text-sm font-medium text-gray-700">
                  Descripción de frutas plantadas
                </label>
                <textarea
                  id="lot-fruits"
                  name="plantedFruitsDescription"
                  placeholder="Descripción detallada de las variedades plantadas..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Creando...' : 'Crear lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
