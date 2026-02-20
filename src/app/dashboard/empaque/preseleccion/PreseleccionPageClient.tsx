'use client';

import { useState, useEffect } from 'react';
import {
  Filter,
  Clock,
  Package,
  ArrowRight,
  Trash2,
  Plus,
  Users,
  Beaker,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { StateCard } from '@/components/dashboard/StateCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/dashboard/ui/dialog';
import { toast } from 'sonner';
import {
  createPreselectionAction,
  addBinToPreselectionAction,
  addWorkerToPreselectionAction,
  registerPreselectionInputAction,
  finalizePreselectionAction,
  generatePreselectionOutputBinAction,
} from '../actions';
import type {
  SerializedPreselection,
  SerializedBin,
  SerializedWorkerOption,
} from '../types';
import { preselectionStatusLabels, preselectionStatusColors } from '../types';

interface Props {
  activePreselection: SerializedPreselection | null;
  history: SerializedPreselection[];
  availableBins: SerializedBin[];
  workers: SerializedWorkerOption[];
}

export function PreseleccionPageClient({
  activePreselection,
  history,
  availableBins,
  workers,
}: Props) {
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [showAddBin, setShowAddBin] = useState(false);
  const [showGenerateBin, setShowGenerateBin] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState('');

  // Timer
  useEffect(() => {
    if (!activePreselection || activePreselection.status !== 'IN_PROGRESS') return;
    const update = () => {
      const start = new Date(activePreselection.startTime).getTime();
      const now = Date.now();
      const diff = now - start;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setElapsed(`${hours}h ${mins}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [activePreselection]);

  const handleFinalize = async () => {
    if (!activePreselection) return;
    const discardKg = prompt('Ingrese la cantidad de descarte en kg:', '0');
    if (discardKg === null) return;
    try {
      await finalizePreselectionAction(activePreselection.id, Number(discardKg));
      toast.success('Preselección finalizada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleStartNew = async () => {
    try {
      const defaultConfig = [
        { outputNumber: 1, color: 'Color 1', isDiscard: false, label: 'S1 Color 1' },
        { outputNumber: 2, color: 'Color 2', isDiscard: false, label: 'S2 Color 2' },
        { outputNumber: 3, color: 'Color 3', isDiscard: false, label: 'S3 Color 3' },
        { outputNumber: 4, color: 'Color 4', isDiscard: false, label: 'S4 Color 4' },
        { outputNumber: 5, isDiscard: false, label: 'S5 segunda' },
        { outputNumber: 6, isDiscard: true, label: 'S6 Descarte' },
      ];
      const fd = new FormData();
      fd.set('outputConfig', JSON.stringify(defaultConfig));
      await createPreselectionAction(fd);
      toast.success('Nueva preselección iniciada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Preselección</h2>
          <p className="text-sm text-gray-600">
            Clasificación de fruta por color y calidad con generación de lote interno
          </p>
        </div>
      </div>

      {/* Active Preselection */}
      {activePreselection ? (
        <Card className="border-2 border-orange-200 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-600" />
                Preselección en Curso
              </CardTitle>
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                {activePreselection.code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Pause className="h-4 w-4" />
                Pausar
              </button>
              <button
                onClick={handleFinalize}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                <Square className="h-4 w-4" />
                Finalizar
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KPIs Row */}
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="rounded-lg bg-white border border-gray-200 p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Duración</p>
                <p className="text-xl font-bold text-gray-900">{elapsed || '-'}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                  <Package className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Bines Entrada</p>
                <p className="text-xl font-bold text-gray-900">
                  {activePreselection.inputBinCount}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-500">Kg Ingresados</p>
                <p className="text-xl font-bold text-gray-900">
                  {activePreselection.totalInputKg.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Bines Salida</p>
                <p className="text-xl font-bold text-gray-900">
                  {activePreselection.outputBinCount}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                  <Trash2 className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Descarte</p>
                <p className="text-xl font-bold text-gray-900">{activePreselection.discardKg} kg</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddWorker(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <Users className="h-4 w-4" />
                Agregar Trabajador
              </button>
              <button
                onClick={() => setShowAddInput(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <Beaker className="h-4 w-4" />
                Registrar Insumo
              </button>
              <button
                onClick={() => setShowAddBin(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <Plus className="h-4 w-4" />
                Agregar Bin de Entrada
              </button>
              <button
                onClick={() => setShowGenerateBin(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <Package className="h-4 w-4" />
                Generar Bin de Salida
              </button>
            </div>

            {/* Traceability Level */}
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  Nivel de trazabilidad: COMPLETA
                </p>
                <p className="text-xs text-green-600">
                  Todos los bines de entrada tienen trazabilidad completa. Los bines generados
                  heredarán este nivel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Sin preselección activa
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Inicie una nueva preselección para comenzar a clasificar fruta
            </p>
            <button
              onClick={handleStartNew}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Iniciar Preselección
            </button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Historial de Preselecciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((ps) => {
              const isExpanded = expandedHistory.has(ps.id);
              return (
                <div key={ps.id} className="rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                  <button
                    onClick={() => {
                      setExpandedHistory((prev) => {
                        const next = new Set(prev);
                        if (next.has(ps.id)) next.delete(ps.id);
                        else next.add(ps.id);
                        return next;
                      });
                    }}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">{ps.code}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ps.startTime).toLocaleDateString('es-AR')}
                          {ps.endTime &&
                            ` - ${new Date(ps.endTime).toLocaleDateString('es-AR')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-600">
                        {ps.totalInputKg.toLocaleString('es-AR')} kg
                      </span>
                      <span className="text-gray-500">
                        {ps.inputBinCount} → {ps.outputBinCount} bines
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          preselectionStatusColors[ps.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {preselectionStatusLabels[ps.status]}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 space-y-4">
                      {/* Detail KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Duración</p>
                          <p className="font-medium text-gray-900">
                            {ps.totalDurationHours != null ? `${ps.totalDurationHours.toFixed(1)} hs` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Kg Ingresados</p>
                          <p className="font-medium text-gray-900">{ps.totalInputKg.toLocaleString('es-AR')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Descarte</p>
                          <p className="font-medium text-gray-900">{ps.discardKg} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pausas</p>
                          <p className="font-medium text-gray-900">{ps.pauseCount}</p>
                        </div>
                      </div>

                      {/* Workers */}
                      {ps.workers.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Trabajadores</p>
                          <div className="flex flex-wrap gap-2">
                            {ps.workers.map((w) => (
                              <span key={w.id} className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-700">
                                <Users className="h-3 w-3 text-gray-400" />
                                {w.workerName}
                                {w.role && <span className="text-gray-400">· {w.role}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Output Config */}
                      {ps.outputConfig.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Salidas</p>
                          <div className="flex gap-2 flex-wrap">
                            {ps.outputConfig.map((oc) => (
                              <div
                                key={oc.id}
                                className={`rounded border px-3 py-1.5 text-xs ${
                                  oc.isDiscard
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : 'border-gray-200 bg-white text-gray-700'
                                }`}
                              >
                                <span className="font-semibold">S{oc.outputNumber}</span>{' '}
                                {oc.label || oc.color || '-'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {ps.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Notas</p>
                          <p className="text-sm text-gray-700">{ps.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {history.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Sin historial de preselecciones
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Worker Modal */}
      <Dialog open={showAddWorker} onOpenChange={setShowAddWorker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              Agregar Trabajador
            </DialogTitle>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                if (activePreselection) fd.set('preselectionId', activePreselection.id);
                await addWorkerToPreselectionAction(fd);
                toast.success('Trabajador agregado');
                setShowAddWorker(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Trabajador
              </label>
              <select
                name="workerId"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Buscar trabajador...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.firstName} {w.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol en Preselección
              </label>
              <select
                name="role"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar rol</option>
                <option value="Operador">Operador</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Clasificador">Clasificador</option>
                <option value="Ayudante">Ayudante</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWorker(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Agregar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Input Modal */}
      <Dialog open={showAddInput} onOpenChange={setShowAddInput}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Insumo</DialogTitle>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                if (activePreselection) fd.set('preselectionId', activePreselection.id);
                await registerPreselectionInputAction(fd);
                toast.success('Insumo registrado');
                setShowAddInput(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insumo *</label>
              <input
                name="itemName"
                required
                placeholder="Cloro, Detergente..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                <input
                  name="quantity"
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                <select
                  name="unit"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="lt">Litros</option>
                  <option value="kg">Kilogramos</option>
                  <option value="un">Unidades</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddInput(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Registrar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Bin to Preselection */}
      <Dialog open={showAddBin} onOpenChange={setShowAddBin}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Bin de Entrada</DialogTitle>
            <DialogDescription>Seleccione un bin de la playa para agregar a la preselección</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableBins.map((bin) => (
              <button
                key={bin.id}
                onClick={async () => {
                  if (!activePreselection) return;
                  try {
                    await addBinToPreselectionAction(activePreselection.id, bin.id);
                    toast.success(`Bin ${bin.code} agregado`);
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Error');
                  }
                }}
                className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:border-green-300 hover:bg-green-50 text-left"
              >
                <div>
                  <p className="font-medium text-sm">{bin.code}</p>
                  <p className="text-xs text-gray-500">{bin.fruitType}</p>
                </div>
                <span className="text-sm font-medium">{bin.netWeight} kg</span>
              </button>
            ))}
            {availableBins.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">
                No hay bines disponibles en playa
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Output Bin */}
      <Dialog open={showGenerateBin} onOpenChange={setShowGenerateBin}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Bin de Salida</DialogTitle>
            <DialogDescription>Registre un bin resultante de la preselección</DialogDescription>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                if (activePreselection) fd.set('preselectionId', activePreselection.id);
                await generatePreselectionOutputBinAction(fd);
                toast.success('Bin de salida generado');
                setShowGenerateBin(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error');
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                <select
                  name="fruitColor"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="Color 1">Color 1</option>
                  <option value="Color 2">Color 2</option>
                  <option value="Color 3">Color 3</option>
                  <option value="Color 4">Color 4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calidad *</label>
                <select
                  name="fruitQuality"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="Primera">Primera</option>
                  <option value="Segunda">Segunda</option>
                  <option value="Tercera">Tercera</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fruta *</label>
              <input
                name="fruitType"
                required
                placeholder="Naranja Valencia Late"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campo</label>
                <input
                  name="fieldName"
                  placeholder="Campo El Naranjo"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                <input
                  name="lotName"
                  placeholder="Lote 5"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso neto (kg) *</label>
              <input
                name="netWeight"
                type="number"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGenerateBin(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Generar Bin
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
