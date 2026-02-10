'use client';

import { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  Package,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  QrCode,
  ArrowRight,
  Clock,
  Weight,
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
  createTruckEntryAction,
  createBinAction,
  finalizeTruckEntryAction,
} from '../actions';
import type { SerializedTruckEntry, SerializedBin } from '../types';
import { truckEntryStatusLabels, truckEntryStatusColors } from '../types';

interface Props {
  entries: SerializedTruckEntry[];
  yardBins: SerializedBin[];
  fields: { id: string; name: string }[];
}

export function BalanzaPageClient({ entries, yardBins, fields }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showBinModal, setShowBinModal] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const todayEntries = entries.filter((e) => {
    const d = new Date(e.entryDate);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const totalBinsRegistered = entries.reduce((acc, e) => acc + e.bins.length, 0);
  const totalKgIngresados = entries.reduce((acc, e) => acc + e.totalWeight, 0);
  const pendingEntries = entries.filter((e) => e.status === 'PENDING').length;

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) => {
      const matchSearch =
        !q ||
        e.remitoNumber.toLowerCase().includes(q) ||
        e.dtv.toLowerCase().includes(q) ||
        e.driverName.toLowerCase().includes(q) ||
        e.transport.toLowerCase().includes(q);
      const matchStatus = !statusFilter || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [entries, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Balanza - Ingreso de Fruta</h2>
          <p className="text-sm text-gray-600">Registro de camiones y creación de bines para trazabilidad</p>
        </div>
        <button
          onClick={() => setShowNewEntryModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ingreso
        </button>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StateCard
          title="Ingresos Hoy"
          value={todayEntries.length}
          icon={Truck}
          iconColor="text-blue-600"
        />
        <StateCard
          title="Bines Registrados"
          value={totalBinsRegistered}
          icon={Package}
          iconColor="text-green-600"
        />
        <StateCard
          title="Kg Ingresados"
          value={totalKgIngresados.toLocaleString('es-AR')}
          icon={Weight}
          iconColor="text-orange-600"
        />
        <StateCard
          title="Pendientes"
          value={pendingEntries}
          icon={AlertTriangle}
          iconColor="text-yellow-600"
        />
      </section>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por remito, DTV, chofer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="FINALIZED">Finalizado</option>
        </select>
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="pb-3 font-medium">Remito</th>
                  <th className="pb-3 font-medium">DTV</th>
                  <th className="pb-3 font-medium">Transporte</th>
                  <th className="pb-3 font-medium">Chofer</th>
                  <th className="pb-3 font-medium">Origen</th>
                  <th className="pb-3 font-medium">Fecha/Hora</th>
                  <th className="pb-3 font-medium">Bines</th>
                  <th className="pb-3 font-medium">Peso Neto</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{entry.remitoNumber}</td>
                    <td className="py-3 text-gray-600">{entry.dtv}</td>
                    <td className="py-3 text-gray-600">{entry.transport}</td>
                    <td className="py-3">
                      <div>
                        <p className="text-gray-900">{entry.driverName}</p>
                        <p className="text-xs text-gray-500">DNI: {entry.driverDni}</p>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{entry.fieldOrigin || '-'}</td>
                    <td className="py-3 text-gray-600">
                      {new Date(entry.entryDate).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 text-gray-900 font-medium">{entry.bins.length}</td>
                    <td className="py-3 text-gray-900 font-medium">
                      {entry.totalWeight.toLocaleString('es-AR')} kg
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          truckEntryStatusColors[entry.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {truckEntryStatusLabels[entry.status] || entry.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">
                      No se encontraron ingresos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Yard Bins */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Bines en Playa de Entrada
            </CardTitle>
            <span className="text-sm text-gray-500">{yardBins.length} disponibles</span>
          </div>
          <button className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <QrCode className="h-4 w-4" />
            Escanear QR
          </button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {yardBins.slice(0, 6).map((bin) => (
              <div key={bin.id} className="rounded-lg border border-gray-200 p-4 hover:border-green-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{bin.code}</p>
                    <p className="text-xs text-gray-500">{bin.fruitType}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    completa
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Peso neto:</span>
                    <span className="font-medium text-gray-900">{bin.netWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Campo:</span>
                    <span className="text-gray-700">{bin.fieldName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo bin:</span>
                    <span className="text-gray-700">{bin.binType || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button className="flex-1 inline-flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-900 py-1.5 rounded border border-gray-200 hover:bg-gray-50">
                    <Eye className="h-3 w-3" />
                    Detalle
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-1 text-xs text-white bg-orange-500 hover:bg-orange-600 py-1.5 rounded font-medium">
                    <ArrowRight className="h-3 w-3" />
                    A Preselección
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Truck Entry Modal */}
      <Dialog open={showNewEntryModal} onOpenChange={setShowNewEntryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Registrar Nuevo Ingreso de Camión
            </DialogTitle>
            <DialogDescription>
              Complete los datos del camión y remito para iniciar el proceso de descarga
            </DialogDescription>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                const entryId = await createTruckEntryAction(fd);
                toast.success('Ingreso registrado correctamente');
                setShowNewEntryModal(false);
                setSelectedEntryId(entryId);
                setShowBinModal(true);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error al registrar ingreso');
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Remito *
                </label>
                <input
                  name="remitoNumber"
                  placeholder="R-2024-XXXX"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DTV *</label>
                <input
                  name="dtv"
                  placeholder="DTV-XXXXX"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporte *</label>
                <select
                  name="transport"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar transporte</option>
                  <option value="Transportes Pérez">Transportes Pérez</option>
                  <option value="Logística del Norte">Logística del Norte</option>
                  <option value="Drube Elsa">Drube Elsa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad Productora *
                </label>
                <select
                  name="producerUnit"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar campo</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patente Chasis</label>
                <input
                  name="chassis"
                  placeholder="ABC-123"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patente Acoplado</label>
                <input
                  name="trailer"
                  placeholder="XYZ-456"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Chofer *
                </label>
                <input
                  name="driverName"
                  placeholder="Nombre completo"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI Chofer *</label>
                <input
                  name="driverDni"
                  placeholder="12345678"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <input type="hidden" name="fieldOrigin" value="" />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewEntryModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Truck className="h-4 w-4" />
                Registrar e Ir a Pesar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Bin Modal */}
      <Dialog open={showBinModal} onOpenChange={setShowBinModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Bin</DialogTitle>
            <DialogDescription>
              Complete los datos del bin descargado del camión
            </DialogDescription>
          </DialogHeader>
          <form
            action={async (fd: FormData) => {
              try {
                if (selectedEntryId) fd.set('truckEntryId', selectedEntryId);
                await createBinAction(fd);
                toast.success('Bin registrado correctamente');
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error al registrar bin');
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campo *</label>
                <input
                  name="fieldName"
                  required
                  placeholder="M CRUZ"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fruta *</label>
                <input
                  name="fruitType"
                  required
                  placeholder="Naranja-Valencia Late"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                <input
                  name="lotName"
                  required
                  placeholder="pérez 25"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contratista</label>
                <input
                  name="contractor"
                  placeholder="Rojas"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo cosecha</label>
                <select
                  name="harvestType"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="Del Suelo">Del Suelo</option>
                  <option value="De Planta">De Planta</option>
                  <option value="Manual">Manual</option>
                  <option value="Mecánica">Mecánica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo bin</label>
                <select
                  name="binType"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="Plástico">Plástico</option>
                  <option value="Plástico Azul">Plástico Azul</option>
                  <option value="Madera">Madera</option>
                  <option value="Metal">Metal</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso vacío (kg)</label>
                <input
                  name="emptyWeight"
                  type="number"
                  step="0.01"
                  placeholder="195"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso neto (kg) *</label>
                <input
                  name="netWeight"
                  type="number"
                  step="0.01"
                  required
                  placeholder="2018"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID del bin</label>
                <input
                  name="binIdentifier"
                  placeholder="006483562"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isTrazable"
                    value="true"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                  Trazable
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBinModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Registrar Bin
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
