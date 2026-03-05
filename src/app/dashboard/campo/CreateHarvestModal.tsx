'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Wheat } from 'lucide-react';
import { createHarvestRecordAction } from './actions';
import type { SerializedField } from './types';

interface CreateHarvestModalProps {
  fields: SerializedField[];
  /** If provided, pre-select this lot */
  preselectedLotId?: string;
}

export function CreateHarvestModal({ fields, preselectedLotId }: CreateHarvestModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedLotId, setSelectedLotId] = useState(preselectedLotId || '');
  const router = useRouter();

  // Resolve the crop types available for the selected lot
  const lotCrops = useMemo(() => {
    if (!selectedLotId) return [];
    for (const f of fields) {
      const lot = f.lots.find((l) => l.id === selectedLotId);
      if (lot) return lot.crops;
    }
    return [];
  }, [fields, selectedLotId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createHarvestRecordAction(formData);
      setOpen(false);
      setSelectedLotId(preselectedLotId || '');
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Wheat className="h-4 w-4" />
        Registrar cosecha
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Registrar cosecha</h2>
            <p className="mt-1 text-sm text-gray-500">
              Registrá un movimiento productivo de cosecha en un lote.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="harvest-lot" className="block text-sm font-medium text-gray-700">
                  Lote <span className="text-red-500">*</span>
                </label>
                <select
                  id="harvest-lot"
                  name="lotId"
                  required
                  value={selectedLotId}
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Seleccioná un lote</option>
                  {fields.flatMap((f) =>
                    f.lots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {f.name} · {l.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="harvest-crop" className="block text-sm font-medium text-gray-700">
                  Cultivo <span className="text-red-500">*</span>
                </label>
                {lotCrops.length > 0 ? (
                  <select
                    id="harvest-crop"
                    name="cropType"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  >
                    <option value="">Seleccioná un cultivo</option>
                    {lotCrops.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="harvest-crop"
                    name="cropType"
                    required
                    placeholder={selectedLotId ? 'Sin cultivos asignados. Ingresá manualmente.' : 'Seleccioná un lote primero...'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="harvest-kilos" className="block text-sm font-medium text-gray-700">
                  Kilos cosechados <span className="text-red-500">*</span>
                </label>
                <input
                  id="harvest-kilos"
                  name="kilos"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="harvest-date" className="block text-sm font-medium text-gray-700">
                  Fecha de cosecha
                </label>
                <input
                  id="harvest-date"
                  name="harvestDate"
                  type="date"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
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
                  {isPending ? 'Registrando...' : 'Registrar cosecha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
