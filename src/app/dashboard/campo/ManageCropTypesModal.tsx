'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Trash2, X } from 'lucide-react';
import { createCropTypeAction, deleteCropTypeAction } from './actions';
import type { SerializedCropType } from './types';

interface ManageCropTypesModalProps {
  cropTypes: SerializedCropType[];
}

export function ManageCropTypesModal({ cropTypes }: ManageCropTypesModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#16a34a');
  const [creating, startCreate] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    startCreate(async () => {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('color', color);
      await createCropTypeAction(formData);
      setName('');
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteCropTypeAction(id);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Leaf className="h-3.5 w-3.5" />
        Tipos de cultivo
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Administrar tipos de cultivo</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Los tipos de cultivo se pueden asignar a los lotes y se usan en los registros de cosecha.
            </p>

            {/* Existing crop types */}
            <div className="mt-4 space-y-1.5 max-h-48 overflow-y-auto">
              {cropTypes.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  No hay tipos de cultivo creados todavía.
                </p>
              ) : (
                cropTypes.map((ct) => (
                  <div
                    key={ct.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-4 w-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: ct.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{ct.name}</span>
                    </div>
                    <button
                      disabled={deleting === ct.id}
                      onClick={() => handleDelete(ct.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Create new */}
            <div className="mt-4 border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Nuevo tipo de cultivo</p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreate();
                      }
                    }}
                    placeholder="Ej: Limones, Naranjas..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 rounded-md border border-gray-300 cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !name.trim()}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? '...' : 'Crear'}
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
