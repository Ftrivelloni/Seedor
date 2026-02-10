'use client';

import { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Package,
  Plus,
  AlertTriangle,
  MoreHorizontal,
  ArrowRight,
  RefreshCw,
  ClipboardList,
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
  ingressBinToChamberAction,
  egressBinFromChamberAction,
  registerChamberTaskAction,
} from '../actions';
import type { SerializedChamber, SerializedBin } from '../types';

interface Props {
  chambers: SerializedChamber[];
  availableBins: SerializedBin[];
}

export function CamarasPageClient({ chambers, availableBins }: Props) {
  const [selectedChamber, setSelectedChamber] = useState<string>(chambers[0]?.id || '');
  const [showIngressModal, setShowIngressModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedBinIds, setSelectedBinIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('registros');

  const activeChamber = chambers.find((c) => c.id === selectedChamber);

  const handleIngress = async () => {
    if (!selectedChamber || selectedBinIds.length === 0) return;
    try {
      await ingressBinToChamberAction(selectedChamber, selectedBinIds);
      toast.success(`${selectedBinIds.length} bines ingresados a cámara`);
      setShowIngressModal(false);
      setSelectedBinIds([]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleEgress = async (binId: string) => {
    try {
      await egressBinFromChamberAction(binId);
      toast.success('Bin egresado de cámara');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Cámaras</h2>
          <p className="text-sm text-gray-600">
            Control de maduración con etileno y almacenamiento en frío
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTaskModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ClipboardList className="h-4 w-4" />
            Registrar Tarea
          </button>
          <button
            onClick={() => setShowIngressModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ingresar Bines
          </button>
        </div>
      </div>

      {/* Chamber Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {chambers.map((ch) => {
          const isSelected = ch.id === selectedChamber;
          const occupancyPercent = Math.round((ch.binsCount / ch.capacity) * 100);
          return (
            <button
              key={ch.id}
              onClick={() => setSelectedChamber(ch.id)}
              className={`rounded-xl border-2 p-5 text-left transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ch.name}</h3>
                  <span className="text-xs text-gray-500">
                    {ch.type === 'ETHYLENE' ? 'Etileno' : 'Frío'}
                  </span>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    ch.type === 'ETHYLENE' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <Thermometer className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5" />
                  {ch.temperature ?? '-'}°C
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5" />
                  {ch.humidity ?? '-'}% HR
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Ocupación</span>
                  <span className="font-medium">
                    {ch.binsCount} / {ch.capacity}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      occupancyPercent > 80 ? 'bg-red-500' : occupancyPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {ch.totalKg.toLocaleString('es-AR')} kg totales
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Chamber Detail */}
      {activeChamber && (
        <>
          {/* Bins in Chamber */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Bines en {activeChamber.name}
                <span className="text-sm font-normal text-gray-500">
                  {activeChamber.binsCount} bines
                </span>
              </CardTitle>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <RefreshCw className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="pb-3 font-medium">Código</th>
                      <th className="pb-3 font-medium">Fruta</th>
                      <th className="pb-3 font-medium">Color Actual</th>
                      <th className="pb-3 font-medium">Peso</th>
                      <th className="pb-3 font-medium">Días en Cámara</th>
                      <th className="pb-3 font-medium">Lote Interno</th>
                      <th className="pb-3 font-medium">Acciones</th>
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
                          <td className="py-3">
                            <button
                              onClick={() => handleEgress(bin.id)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeChamber.bins.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          Cámara vacía
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tasks & History */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="registros">
                <TabsList>
                  <TabsTrigger value="registros">Registros y Tareas</TabsTrigger>
                  <TabsTrigger value="movimientos">Historial Movimientos</TabsTrigger>
                  <TabsTrigger value="costos">Costos</TabsTrigger>
                </TabsList>
                <TabsContent value="registros" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-600">
                          <th className="pb-3 font-medium">Fecha</th>
                          <th className="pb-3 font-medium">Tipo</th>
                          <th className="pb-3 font-medium">Descripción</th>
                          <th className="pb-3 font-medium">Costo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeChamber.tasks.map((task) => (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="py-3 text-gray-600">
                              {new Date(task.date).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  task.type === 'etileno'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : task.type === 'riego'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {task.type}
                              </span>
                            </td>
                            <td className="py-3 text-gray-600">{task.description}</td>
                            <td className="py-3 text-gray-900">
                              {task.cost ? `$${task.cost.toLocaleString('es-AR')}` : '-'}
                            </td>
                          </tr>
                        ))}
                        {activeChamber.tasks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-gray-500">
                              Sin registros
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                <TabsContent value="movimientos" className="mt-4">
                  <p className="text-sm text-gray-500 text-center py-6">Sin movimientos recientes</p>
                </TabsContent>
                <TabsContent value="costos" className="mt-4">
                  <p className="text-sm text-gray-500 text-center py-6">Sin datos de costos</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Ingress Bins Modal */}
      <Dialog open={showIngressModal} onOpenChange={setShowIngressModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Ingresar Bines a Cámara
            </DialogTitle>
            <DialogDescription>
              Seleccione los bines que desea ingresar a{' '}
              {activeChamber?.name || 'la cámara'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cámara Destino</label>
              <select
                value={selectedChamber}
                onChange={(e) => setSelectedChamber(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {chambers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.type === 'ETHYLENE' ? 'Etileno' : 'Frío'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Bines Disponibles</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableBins.map((bin) => (
                  <label
                    key={bin.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedBinIds.includes(bin.id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
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
                        <p className="text-xs text-gray-500">{bin.fruitType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {bin.fruitColor && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 mr-2">
                          {bin.fruitColor}
                        </span>
                      )}
                      <span className="text-sm font-medium">{bin.netWeight} kg</span>
                    </div>
                  </label>
                ))}
                {availableBins.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No hay bines disponibles
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
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-4 w-4" />
                Confirmar Ingreso
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Tarea de Cámara</DialogTitle>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                fd.set('chamberId', selectedChamber);
                await registerChamberTaskAction(fd);
                toast.success('Tarea registrada');
                setShowTaskModal(false);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                name="type"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="etileno">Etileno</option>
                <option value="riego">Riego</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="limpieza">Limpieza</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input
                name="description"
                required
                placeholder="Aplicación de etileno para maduración"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
