'use client';

import { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  DollarSign,
  Undo2,
  Warehouse,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/dashboard/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { toast } from 'sonner';
import {
  createChamberAction,
  ingressBinToChamberAction,
  egressBinFromChamberAction,
  registerChamberTaskAction,
  undoIngressAction,
  undoEgressAction,
} from '../actions';
import type { SerializedChamber, SerializedBin } from '../types';

interface Props {
  chambers: SerializedChamber[];
  availableBins: SerializedBin[];
  egressedBins: SerializedBin[];
}

const taskTypeLabels: Record<string, string> = {
  etileno: 'Recarga de Etileno',
  riego: 'Riego de Piso',
  humedad: 'Control de Humedad',
  mantenimiento: 'Mantenimiento',
  limpieza: 'Limpieza',
};

const taskTypeColors: Record<string, string> = {
  etileno: 'bg-yellow-100 text-yellow-700',
  riego: 'bg-blue-100 text-blue-700',
  humedad: 'bg-cyan-100 text-cyan-700',
  mantenimiento: 'bg-gray-100 text-gray-700',
  limpieza: 'bg-emerald-100 text-emerald-700',
};

export function CamarasPageClient({ chambers, availableBins, egressedBins }: Props) {
  const [selectedChamber, setSelectedChamber] = useState<string>(chambers[0]?.id || '');
  const [showCreateChamber, setShowCreateChamber] = useState(false);
  const [showIngressModal, setShowIngressModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedBinIds, setSelectedBinIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('registros');
  const [egressingBinId, setEgressingBinId] = useState<string | null>(null);
  const [undoingBinId, setUndoingBinId] = useState<string | null>(null);

  const activeChamber = chambers.find((c) => c.id === selectedChamber);

  // Total stats across all chambers
  const totalBins = chambers.reduce((acc, ch) => acc + ch.binsCount, 0);
  const totalKg = chambers.reduce((acc, ch) => acc + ch.totalKg, 0);
  const totalCosts = activeChamber
    ? activeChamber.tasks.reduce((acc, t) => acc + (t.cost ?? 0), 0)
    : 0;

  // Aggregate costs by type for the active chamber
  const costsByType: Record<string, { count: number; total: number }> = {};
  if (activeChamber) {
    for (const t of activeChamber.tasks) {
      if (!costsByType[t.type]) costsByType[t.type] = { count: 0, total: 0 };
      costsByType[t.type].count += 1;
      costsByType[t.type].total += t.cost ?? 0;
    }
  }

  const handleIngress = async () => {
    if (!selectedChamber || selectedBinIds.length === 0) return;
    try {
      await ingressBinToChamberAction(selectedChamber, selectedBinIds);
      toast.success(`${selectedBinIds.length} bin(es) ingresado(s) a cámara`);
      setShowIngressModal(false);
      setSelectedBinIds([]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleEgress = async (binId: string) => {
    setEgressingBinId(binId);
    try {
      await egressBinFromChamberAction(binId);
      toast.success('Bin egresado de cámara correctamente');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setEgressingBinId(null);
    }
  };

  const handleUndoIngress = async (binId: string) => {
    setUndoingBinId(binId);
    try {
      await undoIngressAction(binId);
      toast.success('Ingreso deshecho correctamente');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al deshacer ingreso');
    } finally {
      setUndoingBinId(null);
    }
  };

  const handleUndoEgress = async (binId: string) => {
    setUndoingBinId(binId);
    try {
      await undoEgressAction(binId);
      toast.success('Egreso deshecho — bin devuelto a cámara');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al deshacer egreso');
    } finally {
      setUndoingBinId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Cámaras</h2>
          <p className="text-sm text-gray-600">
            {totalBins} bines en cámara · {totalKg.toLocaleString('es-AR')} kg
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateChamber(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Nueva Cámara
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            disabled={chambers.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardList className="h-4 w-4" />
            Registrar Tarea
          </button>
          <button
            onClick={() => setShowIngressModal(true)}
            disabled={chambers.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Ingresar Bines
          </button>
        </div>
      </div>

      {/* Empty State */}
      {chambers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Warehouse className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin cámaras configuradas</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              Cree su primera cámara para comenzar a gestionar el almacenamiento de bines.
            </p>
            <button
              onClick={() => setShowCreateChamber(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Cámara
            </button>
          </CardContent>
        </Card>
      )}

      {/* Chamber Cards */}
      {chambers.length > 0 && (
      <div className="grid gap-4 lg:grid-cols-3">
        {chambers.map((ch) => {
          const isSelected = ch.id === selectedChamber;
          return (
            <button
              key={ch.id}
              onClick={() => setSelectedChamber(ch.id)}
              className={`rounded-xl border-2 p-5 text-left transition-colors ${
                isSelected
                  ? 'border-green-500 bg-green-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-green-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{ch.name}</h3>
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <Warehouse className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {ch.binsCount} bin(es)
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {ch.totalKg.toLocaleString('es-AR')} kg totales
              </p>
            </button>
          );
        })}
      </div>
      )}

      {/* Selected Chamber Detail */}
      {activeChamber && (
        <>
          {/* Bins in Chamber */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Bines en {activeChamber.name}
                <span className="text-sm font-normal text-gray-500">
                  {activeChamber.binsCount} bin(es) - {activeChamber.totalKg.toLocaleString('es-AR')} kg
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="pb-3 font-medium">Código</th>
                      <th className="pb-3 font-medium">Fruta</th>
                      <th className="pb-3 font-medium">Color</th>
                      <th className="pb-3 font-medium">Peso</th>
                      <th className="pb-3 font-medium">Fecha Ingreso</th>
                      <th className="pb-3 font-medium">Días en Cámara</th>
                      <th className="pb-3 font-medium">Lote Interno</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeChamber.bins.map((bin) => {
                      const daysInChamber = bin.chamberEntryDate
                        ? Math.floor(
                            (Date.now() - new Date(bin.chamberEntryDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0;
                      return (
                        <tr key={bin.id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-900">{bin.code}</td>
                          <td className="py-3 text-gray-600">{bin.fruitType}</td>
                          <td className="py-3">
                            {bin.fruitColor && (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                {bin.fruitColor}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-gray-900">{bin.netWeight} kg</td>
                          <td className="py-3 text-gray-600">
                            {bin.chamberEntryDate
                              ? new Date(bin.chamberEntryDate).toLocaleDateString('es-AR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className="py-3">
                            <span
                              className={`text-sm font-medium ${
                                daysInChamber > 30
                                  ? 'text-red-600'
                                  : daysInChamber > 14
                                  ? 'text-yellow-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {daysInChamber} días
                              {daysInChamber > 30 && (
                                <AlertTriangle className="inline h-3.5 w-3.5 ml-1" />
                              )}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">{bin.internalLot || '-'}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUndoIngress(bin.id)}
                                disabled={undoingBinId === bin.id}
                                title="Deshacer ingreso"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Undo2 className="h-3.5 w-3.5" />
                                {undoingBinId === bin.id ? 'Deshaciendo...' : 'Deshacer'}
                              </button>
                              <button
                                onClick={() => handleEgress(bin.id)}
                                disabled={egressingBinId === bin.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                {egressingBinId === bin.id ? 'Egresando...' : 'Egresar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {activeChamber.bins.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500">
                          Cámara vacía — Ingrese bines desde Preselección
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tasks, Movement History & Costs Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="registros">Registros y Tareas</TabsTrigger>
                  <TabsTrigger value="movimientos">Historial Movimientos</TabsTrigger>
                  <TabsTrigger value="costos">Costos</TabsTrigger>
                </TabsList>

                {/* Registros y Tareas Tab */}
                <TabsContent value="registros" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-600">
                          <th className="pb-3 font-medium">Fecha</th>
                          <th className="pb-3 font-medium">Tipo</th>
                          <th className="pb-3 font-medium">Descripción</th>
                          <th className="pb-3 font-medium text-right">Costo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeChamber.tasks.map((task) => (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="py-3 text-gray-600">
                              {new Date(task.date).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  taskTypeColors[task.type] || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {taskTypeLabels[task.type] || task.type}
                              </span>
                            </td>
                            <td className="py-3 text-gray-600">{task.description}</td>
                            <td className="py-3 text-right text-gray-900">
                              {task.cost ? `$${task.cost.toLocaleString('es-AR')}` : '-'}
                            </td>
                          </tr>
                        ))}
                        {activeChamber.tasks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-gray-500">
                              Sin registros de tareas
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Historial Movimientos Tab */}
                <TabsContent value="movimientos" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-600">
                          <th className="pb-3 font-medium">Código</th>
                          <th className="pb-3 font-medium">Fruta</th>
                          <th className="pb-3 font-medium">Color</th>
                          <th className="pb-3 font-medium">Peso</th>
                          <th className="pb-3 font-medium">Fecha Ingreso</th>
                          <th className="pb-3 font-medium">Fecha Egreso</th>
                          <th className="pb-3 font-medium">Días en Cámara</th>
                          <th className="pb-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {egressedBins.map((bin) => {
                          const entry = bin.chamberEntryDate ? new Date(bin.chamberEntryDate) : null;
                          const exit = bin.chamberExitDate ? new Date(bin.chamberExitDate) : null;
                          const daysInChamber =
                            entry && exit
                              ? Math.floor((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24))
                              : null;
                          return (
                            <tr key={bin.id} className="hover:bg-gray-50">
                              <td className="py-3 font-medium text-gray-900">{bin.code}</td>
                              <td className="py-3 text-gray-600">{bin.fruitType}</td>
                              <td className="py-3">
                                {bin.fruitColor && (
                                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                    {bin.fruitColor}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-gray-900">{bin.netWeight} kg</td>
                              <td className="py-3 text-gray-600">
                                {entry
                                  ? entry.toLocaleDateString('es-AR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit',
                                    })
                                  : '-'}
                              </td>
                              <td className="py-3 text-gray-600">
                                {exit
                                  ? exit.toLocaleDateString('es-AR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit',
                                    })
                                  : '-'}
                              </td>
                              <td className="py-3 text-gray-600">
                                {daysInChamber !== null ? `${daysInChamber} días` : '-'}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleUndoEgress(bin.id)}
                                  disabled={undoingBinId === bin.id}
                                  title="Deshacer egreso — devolver bin a cámara"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                  <Undo2 className="h-3.5 w-3.5" />
                                  {undoingBinId === bin.id ? 'Deshaciendo...' : 'Deshacer'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {egressedBins.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-gray-500">
                              Sin movimientos de egreso registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Costos Tab */}
                <TabsContent value="costos" className="mt-4">
                  {Object.keys(costsByType).length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(costsByType).map(([type, data]) => (
                          <div
                            key={type}
                            className="rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  taskTypeColors[type] || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {taskTypeLabels[type] || type}
                              </span>
                              <span className="text-xs text-gray-500">{data.count} reg.</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              ${data.total.toLocaleString('es-AR')}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Costo Total  {activeChamber.name}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          ${totalCosts.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">
                      Sin datos de costos para {activeChamber.name}
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Chamber Modal */}
      <Dialog open={showCreateChamber} onOpenChange={setShowCreateChamber}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-green-600" />
              Nueva Cámara
            </DialogTitle>
            <DialogDescription>
              Ingrese el nombre para la nueva cámara.
            </DialogDescription>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                await createChamberAction(fd);
                toast.success('Cámara creada correctamente');
                setShowCreateChamber(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error al crear cámara');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                name="name"
                required
                placeholder="Ej: Cámara 1"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateChamber(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Crear Cámara
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ingress Bins Modal */}
      <Dialog open={showIngressModal} onOpenChange={setShowIngressModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Ingresar Bines a Cámara
            </DialogTitle>
            <DialogDescription>
              Bines provenientes de preselección disponibles para ingresar a{' '}
              {activeChamber?.name || 'la cámara'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cámara Destino</label>
              <select
                value={selectedChamber}
                onChange={(e) => setSelectedChamber(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {chambers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} — {ch.binsCount} bines
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Bines Disponibles ({availableBins.length})
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableBins.map((bin) => (
                  <label
                    key={bin.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedBinIds.includes(bin.id)
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedBinIds.includes(bin.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBinIds([...selectedBinIds, bin.id]);
                          } else {
                            setSelectedBinIds(selectedBinIds.filter((id) => id !== bin.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium">{bin.code}</p>
                        <p className="text-xs text-gray-500">
                          {bin.fruitType}
                          {bin.fruitColor ? ` - ${bin.fruitColor}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{bin.netWeight} kg</span>
                  </label>
                ))}
                {availableBins.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No hay bines disponibles desde preselección
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowIngressModal(false);
                  setSelectedBinIds([]);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleIngress}
                disabled={selectedBinIds.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-4 w-4" />
                Confirmar Ingreso ({selectedBinIds.length})
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-gray-600" />
              Registrar Tarea de Cámara
            </DialogTitle>
            <DialogDescription>
              Registre tareas de mantenimiento, recargas de etileno, riego de piso y otros costos.
            </DialogDescription>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                fd.set('chamberId', selectedChamber);
                await registerChamberTaskAction(fd);
                toast.success('Tarea registrada correctamente');
                setShowTaskModal(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cámara *</label>
              <select
                value={selectedChamber}
                onChange={(e) => setSelectedChamber(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {chambers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                name="type"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="etileno">Recarga de Etileno</option>
                <option value="riego">Riego de Piso</option>
                <option value="humedad">Control de Humedad</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="limpieza">Limpieza</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input
                name="description"
                required
                placeholder="Ej: Recarga de gas etileno 500 ppm"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
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
    </div>
  );
}
