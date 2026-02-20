'use client';

import { useState, useEffect } from 'react';
import {
  Filter,
  Clock,
  Package,
  Plus,
  Users,
  Beaker,
  Pause,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
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
  pausePreselectionAction,
  resumePreselectionAction,
  updatePreselectionAction,
} from '../actions';
import type {
  SerializedPreselection,
  SerializedBin,
  SerializedWorkerOption,
} from '../types';
import { preselectionStatusLabels, preselectionStatusColors, binStatusLabels } from '../types';

interface FieldData {
  id: string;
  name: string;
  lots: { id: string; name: string; crops: string[] }[];
}

interface Props {
  activePreselection: SerializedPreselection | null;
  history: SerializedPreselection[];
  availableBins: SerializedBin[];
  preselectionYardBins: SerializedBin[];
  workers: SerializedWorkerOption[];
  fields: FieldData[];
  inventoryItems: { id: string; name: string; unit: string }[];
  warehouses: { id: string; name: string }[];
}

export function PreseleccionPageClient({
  activePreselection,
  history,
  availableBins,
  preselectionYardBins,
  workers,
  fields,
  inventoryItems,
  warehouses,
}: Props) {
  const [selectedYardBin, setSelectedYardBin] = useState<SerializedBin | null>(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [showAddBin, setShowAddBin] = useState(false);
  const [showGenerateBin, setShowGenerateBin] = useState(false);
  const [showOutputBins, setShowOutputBins] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [editingPs, setEditingPs] = useState<SerializedPreselection | null>(null);
  const [elapsed, setElapsed] = useState('');

  // Output bin form state for cascading selects
  const [outputFieldName, setOutputFieldName] = useState('');
  const [outputLotName, setOutputLotName] = useState('');
  const [outputFruitType, setOutputFruitType] = useState('');

  // Inventory supply form state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemUnit, setSelectedItemUnit] = useState('');

  // Timer
  useEffect(() => {
    if (!activePreselection || activePreselection.status === 'COMPLETED') return;
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

  const handlePause = async () => {
    if (!activePreselection) return;
    try {
      await pausePreselectionAction(activePreselection.id);
      toast.success('Preselección pausada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleResume = async () => {
    if (!activePreselection) return;
    try {
      await resumePreselectionAction(activePreselection.id);
      toast.success('Preselección reanudada');
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

  // Cascading select helpers
  function getLotsForField(fieldName: string) {
    const field = fields.find((f) => f.name === fieldName);
    return field?.lots ?? [];
  }

  function getCropsForLot(fieldName: string, lotName: string) {
    const field = fields.find((f) => f.name === fieldName);
    const lot = field?.lots.find((l) => l.name === lotName);
    return lot?.crops ?? [];
  }

  // Compute merma for a preselection
  function computeMerma(ps: SerializedPreselection) {
    return ps.totalInputKg - ps.totalOutputKg - ps.discardKg;
  }

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
        <Card className={`border-2 ${activePreselection.status === 'PAUSED' ? 'border-yellow-200 bg-yellow-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-600" />
                {activePreselection.status === 'PAUSED' ? 'Preselección Pausada' : 'Preselección en Curso'}
              </CardTitle>
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                {activePreselection.code}
              </span>
              {activePreselection.status === 'PAUSED' && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 border border-yellow-200">
                  PAUSADA
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activePreselection.status === 'IN_PROGRESS' ? (
                <button
                  onClick={handlePause}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pause className="h-4 w-4" />
                  Pausar
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  <Play className="h-4 w-4" />
                  Reanudar
                </button>
              )}
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
                <p className="text-xs text-gray-500">Kg Egresados</p>
                <p className="text-xl font-bold text-gray-900">
                  {activePreselection.totalOutputKg.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Merma</p>
                <p className="text-xl font-bold text-gray-900">
                  {computeMerma(activePreselection).toLocaleString('es-AR')} kg
                </p>
              </div>
            </div>

            {/* Alert: egreso > ingreso */}
            {activePreselection.totalOutputKg > activePreselection.totalInputKg && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Los kg egresados ({activePreselection.totalOutputKg.toLocaleString('es-AR')}) superan los kg ingresados ({activePreselection.totalInputKg.toLocaleString('es-AR')}).
                  </p>
                  <p className="text-xs text-red-600">
                    Verifique los pesos de los bines de salida.
                  </p>
                </div>
              </div>
            )}

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
                onClick={() => {
                  setOutputFieldName('');
                  setOutputLotName('');
                  setOutputFruitType('');
                  setShowGenerateBin(true);
                }}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <Package className="h-4 w-4" />
                Generar Bin de Salida
              </button>
              {activePreselection.outputBinCount > 0 && (
                <button
                  onClick={() => setShowOutputBins(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 font-medium"
                >
                  <Eye className="h-4 w-4" />
                  Ver Bines de Salida ({activePreselection.outputBinCount})
                </button>
              )}
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
              const merma = computeMerma(ps);
              const egresoExceedsIngreso = ps.totalOutputKg > ps.totalInputKg;

              return (
                <div key={ps.id} className="rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <button
                      onClick={() => {
                        setExpandedHistory((prev) => {
                          const next = new Set(prev);
                          if (next.has(ps.id)) next.delete(ps.id);
                          else next.add(ps.id);
                          return next;
                        });
                      }}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        {egresoExceedsIngreso ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Filter className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{ps.code}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(ps.startTime).toLocaleDateString('es-AR')}
                            {ps.endTime &&
                              ` - ${new Date(ps.endTime).toLocaleDateString('es-AR')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm ml-auto mr-4">
                        <span className="text-gray-600">
                          {ps.totalInputKg.toLocaleString('es-AR')} kg
                        </span>
                        <span className="text-gray-500">
                          {ps.inputBinCount} → {ps.outputBinCount} bines
                        </span>
                        <span className="text-gray-500">
                          Merma: {merma.toLocaleString('es-AR')} kg
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
                    <button
                      onClick={() => setEditingPs(ps)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 ml-2"
                      title="Editar preselección"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 space-y-4">
                      {/* Alert: egreso > ingreso */}
                      {egresoExceedsIngreso && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-700">
                            Los kg egresados ({ps.totalOutputKg.toLocaleString('es-AR')}) superan los kg ingresados ({ps.totalInputKg.toLocaleString('es-AR')}).
                          </p>
                        </div>
                      )}

                      {/* Detail KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
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
                          <p className="text-gray-500">Kg Egresados</p>
                          <p className="font-medium text-gray-900">{ps.totalOutputKg.toLocaleString('es-AR')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Merma</p>
                          <p className={`font-medium ${merma < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {merma.toLocaleString('es-AR')} kg
                          </p>
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

                      {/* Output Bins */}
                      {ps.outputBins.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Bines de Salida ({ps.outputBins.length})</p>
                          <div className="rounded-md border divide-y">
                            {ps.outputBins.map((bin) => (
                              <div key={bin.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-medium text-gray-900">{bin.code}</span>
                                  <span className="text-gray-500">{bin.fruitType || '-'}</span>
                                  <span className="text-gray-500">{bin.fruitColor || '-'}</span>
                                </div>
                                <span className="font-medium">{bin.netWeight} kg</span>
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

      {/* ═══ Playa de Bines de Preselección ═══ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Bines en Playa de Preselección
            </CardTitle>
            <span className="text-sm text-gray-500">{preselectionYardBins.length} disponibles</span>
          </div>
        </CardHeader>
        <CardContent>
          {preselectionYardBins.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay bines en playa de preselección
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {preselectionYardBins.slice(0, 6).map((bin) => (
                <div key={bin.id} className="rounded-lg border border-gray-200 p-4 hover:border-green-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{bin.code}</p>
                      <p className="text-xs text-gray-500">{bin.fruitType}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {binStatusLabels[bin.status] || bin.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Peso neto:</span>
                      <span className="font-medium text-gray-900">{bin.netWeight} kg</span>
                    </div>
                    {bin.fruitColor && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Color:</span>
                        <span className="text-gray-700">{bin.fruitColor}</span>
                      </div>
                    )}
                    {bin.fruitQuality && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Calidad:</span>
                        <span className="text-gray-700">{bin.fruitQuality}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Campo:</span>
                      <span className="text-gray-700">{bin.fieldName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lote:</span>
                      <span className="text-gray-700">{bin.lotName}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedYardBin(bin)}
                      className="w-full inline-flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-900 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3" />
                      Ver Detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {preselectionYardBins.length > 6 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Mostrando 6 de {preselectionYardBins.length} bines
            </p>
          )}
        </CardContent>
      </Card>

      {/* ═══ Yard Bin Detail Modal ═══ */}
      <Dialog open={!!selectedYardBin} onOpenChange={() => setSelectedYardBin(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Detalle del Bin
            </DialogTitle>
            <DialogDescription>
              Información del bin {selectedYardBin?.code}
            </DialogDescription>
          </DialogHeader>
          {selectedYardBin && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Código:</span>
                <span className="font-medium">{selectedYardBin.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {binStatusLabels[selectedYardBin.status] || selectedYardBin.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fruta:</span>
                <span>{selectedYardBin.fruitType}</span>
              </div>
              {selectedYardBin.fruitColor && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Color:</span>
                  <span>{selectedYardBin.fruitColor}</span>
                </div>
              )}
              {selectedYardBin.fruitQuality && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Calidad:</span>
                  <span>{selectedYardBin.fruitQuality}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Peso neto:</span>
                <span className="font-medium">{selectedYardBin.netWeight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Campo:</span>
                <span>{selectedYardBin.fieldName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lote:</span>
                <span>{selectedYardBin.lotName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lote interno:</span>
                <span>{selectedYardBin.internalLot || '—'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Add Worker Modal ═══ */}
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

      {/* ═══ Add Input (Supply) Modal ═══ */}
      <Dialog open={showAddInput} onOpenChange={setShowAddInput}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-gray-600" />
              Registrar Insumo
            </DialogTitle>
            <DialogDescription>
              Seleccione un insumo del inventario para registrar el consumo.
            </DialogDescription>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                if (activePreselection) fd.set('preselectionId', activePreselection.id);
                // Set itemName from selected inventory item
                const itemId = fd.get('inventoryItemId') as string;
                const item = inventoryItems.find((i) => i.id === itemId);
                if (item) fd.set('itemName', item.name);
                await registerPreselectionInputAction(fd);
                toast.success('Insumo registrado');
                setShowAddInput(false);
                setSelectedItemId('');
                setSelectedItemUnit('');
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insumo del Inventario *</label>
              <select
                name="inventoryItemId"
                required
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  const item = inventoryItems.find((i) => i.id === e.target.value);
                  setSelectedItemUnit(item?.unit ?? '');
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar insumo...</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Depósito de origen *</label>
              <select
                name="warehouseId"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar depósito...</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <input
                  name="unit"
                  value={selectedItemUnit}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500"
                />
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

      {/* ═══ Add Bin to Preselection ═══ */}
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
                  <p className="text-xs text-gray-500">{bin.fruitType} · {bin.fieldName}</p>
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

      {/* ═══ Generate Output Bin ═══ */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Campo *</label>
              <select
                name="fieldName"
                required
                value={outputFieldName}
                onChange={(e) => {
                  setOutputFieldName(e.target.value);
                  setOutputLotName('');
                  setOutputFruitType('');
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar campo</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                <select
                  name="lotName"
                  required
                  disabled={!outputFieldName}
                  value={outputLotName}
                  onChange={(e) => {
                    setOutputLotName(e.target.value);
                    setOutputFruitType('');
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{outputFieldName ? 'Seleccionar lote' : 'Elegir campo primero'}</option>
                  {getLotsForField(outputFieldName).map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fruta *</label>
                <select
                  name="fruitType"
                  required
                  disabled={!outputLotName}
                  value={outputFruitType}
                  onChange={(e) => setOutputFruitType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{outputLotName ? 'Seleccionar fruta' : 'Elegir lote primero'}</option>
                  {getCropsForLot(outputFieldName, outputLotName).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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

      {/* ═══ View Output Bins Modal ═══ */}
      <Dialog open={showOutputBins} onOpenChange={setShowOutputBins}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Bines de Salida
            </DialogTitle>
            <DialogDescription>
              {activePreselection?.outputBinCount ?? 0} bines generados en esta preselección
            </DialogDescription>
          </DialogHeader>
          {activePreselection && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-gray-500 text-xs">Total Kg</p>
                  <p className="font-bold text-gray-900">{activePreselection.totalOutputKg.toLocaleString('es-AR')}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-gray-500 text-xs">Bines</p>
                  <p className="font-bold text-gray-900">{activePreselection.outputBinCount}</p>
                </div>
              </div>
              <div className="rounded-md border divide-y">
                {activePreselection.outputBins.map((bin) => (
                  <div key={bin.id} className="flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium text-gray-900">{bin.code}</span>
                      <span className="text-gray-600">{bin.fruitType || '-'}</span>
                      {bin.fruitColor && (
                        <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">{bin.fruitColor}</span>
                      )}
                      {bin.fruitQuality && (
                        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{bin.fruitQuality}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{bin.fieldName} / {bin.lotName}</span>
                      <span className="font-medium">{bin.netWeight} kg</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        bin.status === 'READY_FOR_PROCESS' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {binStatusLabels[bin.status] || bin.status}
                      </span>
                    </div>
                  </div>
                ))}
                {activePreselection.outputBins.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    Aún no se generaron bines de salida
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Edit Preselection Modal ═══ */}
      <Dialog open={!!editingPs} onOpenChange={(open) => { if (!open) setEditingPs(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-green-600" />
              Editar Preselección {editingPs?.code}
            </DialogTitle>
          </DialogHeader>
          {editingPs && (
            <form
              action={async (fd: FormData) => {
                try {
                  fd.set('preselectionId', editingPs.id);
                  await updatePreselectionAction(fd);
                  toast.success('Preselección actualizada');
                  setEditingPs(null);
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : 'Error');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descarte (kg)</label>
                <input
                  name="discardKg"
                  type="number"
                  step="0.01"
                  defaultValue={editingPs.discardKg}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingPs.notes || ''}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Observaciones sobre esta preselección..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPs(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
