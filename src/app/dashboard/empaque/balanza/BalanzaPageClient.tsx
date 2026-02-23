'use client';

import { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  Package,
  AlertTriangle,
  Eye,
  Weight,
  Pencil,
  X,
  Trash2,
  ChevronRight,
  Minus,
  Settings2,
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
  createMultipleBinsAction,
  finalizeTruckEntryAction,
  updateTruckEntryAction,
  createTransportAction,
  deleteTransportAction,
} from '../actions';
import type { SerializedTruckEntry, SerializedBin } from '../types';
import { truckEntryStatusLabels, truckEntryStatusColors, binStatusLabels } from '../types';

interface FieldData {
  id: string;
  name: string;
  lots: { id: string; name: string; crops: string[] }[];
}

interface Props {
  entries: SerializedTruckEntry[];
  yardBins: SerializedBin[];
  fields: FieldData[];
  transports: { id: string; name: string }[];
}

interface BinDraft {
  fieldName: string;
  fruitType: string;
  lotName: string;
  contractor: string;
  harvestType: string;
  binType: string;
  emptyWeight: string;
  netWeight: string;
  binIdentifier: string;
  isTrazable: boolean;
  quantity: number;
}

const emptyBinDraft: BinDraft = {
  fieldName: '',
  fruitType: '',
  lotName: '',
  contractor: '',
  harvestType: '',
  binType: '',
  emptyWeight: '',
  netWeight: '',
  binIdentifier: '',
  isTrazable: true,
  quantity: 1,
};

export function BalanzaPageClient({ entries, yardBins, fields, transports }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showBinModal, setShowBinModal] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showEntryDetail, setShowEntryDetail] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SerializedTruckEntry | null>(null);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [showBinDetail, setShowBinDetail] = useState(false);
  const [selectedBin, setSelectedBin] = useState<SerializedBin | null>(null);
  const [showTransportConfig, setShowTransportConfig] = useState(false);
  const [newTransportName, setNewTransportName] = useState('');

  // Batch bin creation state
  const [binDrafts, setBinDrafts] = useState<BinDraft[]>([{ ...emptyBinDraft }]);

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

  function handleViewEntry(entry: SerializedTruckEntry) {
    setSelectedEntry(entry);
    setShowEntryDetail(true);
  }

  function handleEditEntry(entry: SerializedTruckEntry) {
    setSelectedEntry(entry);
    setShowEditEntry(true);
  }

  function handleViewBin(bin: SerializedBin) {
    setSelectedBin(bin);
    setShowBinDetail(true);
  }

  function updateBinDraft(index: number, field: keyof BinDraft, value: string | boolean | number) {
    setBinDrafts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // Reset lotName and fruitType when field changes
      if (field === 'fieldName') {
        next[index].lotName = '';
        next[index].fruitType = '';
      }
      // Reset fruitType when lot changes
      if (field === 'lotName') {
        next[index].fruitType = '';
      }
      return next;
    });
  }

  function addBinDraft() {
    setBinDrafts((prev) => [...prev, { ...emptyBinDraft }]);
  }

  function incrementQuantity(index: number) {
    setBinDrafts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: next[index].quantity + 1 };
      return next;
    });
  }

  function decrementQuantity(index: number) {
    setBinDrafts((prev) => {
      const next = [...prev];
      if (next[index].quantity > 1) {
        next[index] = { ...next[index], quantity: next[index].quantity - 1 };
      }
      return next;
    });
  }

  function removeBinDraft(index: number) {
    if (binDrafts.length <= 1) return;
    setBinDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  // Compute available lots for a given field name
  function getLotsForField(fieldName: string) {
    const field = fields.find((f) => f.name === fieldName);
    return field?.lots ?? [];
  }

  // Compute available crops/fruits for a given field + lot
  function getCropsForLot(fieldName: string, lotName: string) {
    const field = fields.find((f) => f.name === fieldName);
    const lot = field?.lots.find((l) => l.name === lotName);
    return lot?.crops ?? [];
  }

  // Total bins accounting for quantity
  const totalBinDrafts = binDrafts.reduce((acc, d) => acc + d.quantity, 0);

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
        <StateCard title="Ingresos Hoy" value={todayEntries.length} icon={Truck} iconColor="text-blue-600" />
        <StateCard title="Bines Registrados" value={totalBinsRegistered} icon={Package} iconColor="text-green-600" />
        <StateCard title="Kg Ingresados" value={totalKgIngresados.toLocaleString('es-AR')} icon={Weight} iconColor="text-orange-600" />
        <StateCard title="Pendientes" value={pendingEntries} icon={AlertTriangle} iconColor="text-yellow-600" />
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewEntry(entry)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {entry.status === 'PENDING' && (
                          <button
                            onClick={async () => {
                              try {
                                await finalizeTruckEntryAction(entry.id);
                                toast.success('Ingreso finalizado');
                              } catch (err: unknown) {
                                toast.error(err instanceof Error ? err.message : 'Error');
                              }
                            }}
                            className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700"
                            title="Finalizar"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
                    {binStatusLabels[bin.status] || bin.status}
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
                    <span className="text-gray-500">Lote:</span>
                    <span className="text-gray-700">{bin.lotName}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleViewBin(bin)}
                    className="w-full inline-flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-900 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    <Eye className="h-3 w-3" />
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Entry Detail Modal ═══ */}
      <Dialog open={showEntryDetail} onOpenChange={setShowEntryDetail}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Detalle del Ingreso
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Remito</p>
                  <p className="font-medium text-gray-900">{selectedEntry.remitoNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">DTV</p>
                  <p className="font-medium text-gray-900">{selectedEntry.dtv}</p>
                </div>
                <div>
                  <p className="text-gray-500">Transporte</p>
                  <p className="font-medium text-gray-900">{selectedEntry.transport}</p>
                </div>
                <div>
                  <p className="text-gray-500">Chofer</p>
                  <p className="font-medium text-gray-900">{selectedEntry.driverName} (DNI: {selectedEntry.driverDni})</p>
                </div>
                <div>
                  <p className="text-gray-500">Chasis</p>
                  <p className="font-medium text-gray-900">{selectedEntry.chassis || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Acoplado</p>
                  <p className="font-medium text-gray-900">{selectedEntry.trailer || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Unidad Productora</p>
                  <p className="font-medium text-gray-900">{selectedEntry.producerUnit || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Origen</p>
                  <p className="font-medium text-gray-900">{selectedEntry.fieldOrigin || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fecha de Ingreso</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedEntry.entryDate).toLocaleString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Estado</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${truckEntryStatusColors[selectedEntry.status] || 'bg-gray-100 text-gray-700'}`}>
                    {truckEntryStatusLabels[selectedEntry.status] || selectedEntry.status}
                  </span>
                </div>
              </div>

              {/* Bins in this entry */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Bines ({selectedEntry.bins.length}) — Total: {selectedEntry.totalWeight.toLocaleString('es-AR')} kg
                </h4>
                {selectedEntry.bins.length > 0 ? (
                  <div className="rounded-md border divide-y">
                    {selectedEntry.bins.map((bin) => (
                      <div key={bin.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-medium text-gray-900">{bin.code}</span>
                          <span className="text-gray-500">{bin.fruitType}</span>
                          <span className="text-gray-500">{bin.lotName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{bin.netWeight} kg</span>
                          <button
                            onClick={() => { handleViewBin(bin); setShowEntryDetail(false); }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay bines registrados para este ingreso.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Bin Detail Modal ═══ */}
      <Dialog open={showBinDetail} onOpenChange={setShowBinDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Detalle del Bin
            </DialogTitle>
          </DialogHeader>
          {selectedBin && (
            <div className="space-y-4">
              <div className="text-center py-3">
                <p className="text-2xl font-bold font-mono text-gray-900">{selectedBin.code}</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                  selectedBin.status === 'IN_YARD' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {binStatusLabels[selectedBin.status] || selectedBin.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Campo</p>
                  <p className="font-medium text-gray-900">{selectedBin.fieldName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lote</p>
                  <p className="font-medium text-gray-900">{selectedBin.lotName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fruta</p>
                  <p className="font-medium text-gray-900">{selectedBin.fruitType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Peso Neto</p>
                  <p className="font-medium text-gray-900">{selectedBin.netWeight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500">Peso Vacío</p>
                  <p className="font-medium text-gray-900">{selectedBin.emptyWeight ? `${selectedBin.emptyWeight} kg` : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tipo Bin</p>
                  <p className="font-medium text-gray-900">{selectedBin.binType || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contratista</p>
                  <p className="font-medium text-gray-900">{selectedBin.contractor || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tipo Cosecha</p>
                  <p className="font-medium text-gray-900">{selectedBin.harvestType || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Identificador</p>
                  <p className="font-medium text-gray-900">{selectedBin.binIdentifier || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trazable</p>
                  <p className="font-medium text-gray-900">{selectedBin.isTrazable ? 'Sí' : 'No'}</p>
                </div>
                {selectedBin.fruitColor && (
                  <div>
                    <p className="text-gray-500">Color</p>
                    <p className="font-medium text-gray-900">{selectedBin.fruitColor}</p>
                  </div>
                )}
                {selectedBin.fruitQuality && (
                  <div>
                    <p className="text-gray-500">Calidad</p>
                    <p className="font-medium text-gray-900">{selectedBin.fruitQuality}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Creado</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedBin.createdAt).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Edit Entry Modal ═══ */}
      <Dialog open={showEditEntry} onOpenChange={setShowEditEntry}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-green-600" />
              Editar Ingreso
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <form
              action={async (fd: FormData) => {
                try {
                  fd.set('entryId', selectedEntry.id);
                  await updateTruckEntryAction(fd);
                  toast.success('Ingreso actualizado correctamente');
                  setShowEditEntry(false);
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : 'Error al actualizar');
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Remito *</label>
                  <input name="remitoNumber" defaultValue={selectedEntry.remitoNumber} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DTV *</label>
                  <input name="dtv" defaultValue={selectedEntry.dtv} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transporte *</label>
                  <select name="transport" defaultValue={selectedEntry.transport} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Seleccionar transporte</option>
                    {transports.map((t) => (<option key={t.id} value={t.name}>{t.name}</option>))}
                    {/* Keep current value if not in list */}
                    {selectedEntry.transport && !transports.some((t) => t.name === selectedEntry.transport) && (
                      <option value={selectedEntry.transport}>{selectedEntry.transport}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Productora</label>
                  <select name="producerUnit" defaultValue={selectedEntry.producerUnit || ''} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Seleccionar campo</option>
                    {fields.map((f) => (<option key={f.id} value={f.name}>{f.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patente Chasis</label>
                  <input name="chassis" defaultValue={selectedEntry.chassis || ''} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patente Acoplado</label>
                  <input name="trailer" defaultValue={selectedEntry.trailer || ''} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Chofer *</label>
                  <input name="driverName" defaultValue={selectedEntry.driverName} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI Chofer *</label>
                  <input name="driverDni" defaultValue={selectedEntry.driverDni} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <input type="hidden" name="fieldOrigin" value="" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditEntry(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                setBinDrafts([{ ...emptyBinDraft }]);
                setShowBinModal(true);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error al registrar ingreso');
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Remito *</label>
                <input name="remitoNumber" placeholder="R-2024-XXXX" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DTV *</label>
                <input name="dtv" placeholder="DTV-XXXXX" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporte *</label>
                <div className="flex gap-2">
                  <select name="transport" required className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Seleccionar transporte</option>
                    {transports.map((t) => (<option key={t.id} value={t.name}>{t.name}</option>))}
                  </select>
                  <button type="button" onClick={() => setShowTransportConfig(true)} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50" title="Configurar transportes">
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Productora</label>
                <select name="producerUnit" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Seleccionar campo</option>
                  {fields.map((f) => (<option key={f.id} value={f.name}>{f.name}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patente Chasis</label>
                <input name="chassis" placeholder="ABC-123" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patente Acoplado</label>
                <input name="trailer" placeholder="XYZ-456" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Chofer *</label>
                <input name="driverName" placeholder="Nombre completo" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI Chofer *</label>
                <input name="driverDni" placeholder="12345678" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <input type="hidden" name="fieldOrigin" value="" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowNewEntryModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                <Truck className="h-4 w-4" />
                Registrar e Ir a Pesar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ Batch Bin Creation Modal ═══ */}
      <Dialog open={showBinModal} onOpenChange={setShowBinModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Registrar Bines
            </DialogTitle>
            <DialogDescription>
              Configure cada tipo de bin y use la cantidad para crear múltiples bines iguales.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {binDrafts.map((draft, idx) => {
              const availableLots = getLotsForField(draft.fieldName);
              const availableCrops = getCropsForLot(draft.fieldName, draft.lotName);

              return (
                <div key={idx} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 px-1">
                        <button type="button" onClick={() => decrementQuantity(idx)} disabled={draft.quantity <= 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900 min-w-[2rem] text-center">{draft.quantity}</span>
                        <button type="button" onClick={() => incrementQuantity(idx)} className="p-1 text-gray-400 hover:text-gray-600">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">bines</span>
                      {binDrafts.length > 1 && (
                        <button type="button" onClick={() => removeBinDraft(idx)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600" title="Eliminar tipo">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Campo *</label>
                      <select value={draft.fieldName} onChange={(e) => updateBinDraft(idx, 'fieldName', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Seleccionar</option>
                        {fields.map((f) => (<option key={f.id} value={f.name}>{f.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Lote *</label>
                      <select value={draft.lotName} onChange={(e) => updateBinDraft(idx, 'lotName', e.target.value)} disabled={!draft.fieldName} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400">
                        <option value="">{draft.fieldName ? 'Seleccionar' : 'Elegir campo primero'}</option>
                        {availableLots.map((l) => (<option key={l.id} value={l.name}>{l.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Fruta *</label>
                      <select value={draft.fruitType} onChange={(e) => updateBinDraft(idx, 'fruitType', e.target.value)} disabled={!draft.lotName} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400">
                        <option value="">{draft.lotName ? 'Seleccionar' : 'Elegir lote primero'}</option>
                        {availableCrops.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Peso Neto (kg) *</label>
                      <input value={draft.netWeight} onChange={(e) => updateBinDraft(idx, 'netWeight', e.target.value)} type="number" step="0.01" placeholder="2018" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Peso Vacío (kg)</label>
                      <input value={draft.emptyWeight} onChange={(e) => updateBinDraft(idx, 'emptyWeight', e.target.value)} type="number" step="0.01" placeholder="195" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Contratista</label>
                      <input value={draft.contractor} onChange={(e) => updateBinDraft(idx, 'contractor', e.target.value)} placeholder="Rojas" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Tipo Cosecha</label>
                      <select value={draft.harvestType} onChange={(e) => updateBinDraft(idx, 'harvestType', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Seleccionar</option>
                        <option value="Del Suelo">Del Suelo</option>
                        <option value="De Planta">De Planta</option>
                        <option value="Manual">Manual</option>
                        <option value="Mecánica">Mecánica</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Tipo Bin</label>
                      <select value={draft.binType} onChange={(e) => updateBinDraft(idx, 'binType', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Seleccionar</option>
                        <option value="Plástico">Plástico</option>
                        <option value="Plástico Azul">Plástico Azul</option>
                        <option value="Madera">Madera</option>
                        <option value="Metal">Metal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">ID del Bin</label>
                      <input value={draft.binIdentifier} onChange={(e) => updateBinDraft(idx, 'binIdentifier', e.target.value)} placeholder="006483562" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addBinDraft}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar otro tipo de bin
            </button>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{totalBinDrafts}</span> bin(es) en total
                {binDrafts.length > 1 && (
                  <span className="text-gray-400"> · {binDrafts.length} tipo(s)</span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBinModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const fd = new FormData();
                      if (selectedEntryId) fd.set('truckEntryId', selectedEntryId);
                      fd.set('bins', JSON.stringify(
                        binDrafts.map((d) => ({
                          fieldName: d.fieldName,
                          fruitType: d.fruitType,
                          lotName: d.lotName,
                          contractor: d.contractor || undefined,
                          harvestType: d.harvestType || undefined,
                          binType: d.binType || undefined,
                          emptyWeight: d.emptyWeight ? Number(d.emptyWeight) : undefined,
                          netWeight: Number(d.netWeight),
                          isTrazable: d.isTrazable,
                          binIdentifier: d.binIdentifier || undefined,
                          quantity: d.quantity,
                        }))
                      ));
                      await createMultipleBinsAction(fd);
                      toast.success(`${totalBinDrafts} bin(es) registrado(s) correctamente`);
                      setBinDrafts([{ ...emptyBinDraft }]);
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Error al registrar bines');
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Registrar {totalBinDrafts > 1 ? `${totalBinDrafts} Bines` : 'Bin'}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Transport Config Modal ═══ */}
      <Dialog open={showTransportConfig} onOpenChange={setShowTransportConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-green-600" />
              Configurar Transportes
            </DialogTitle>
            <DialogDescription>
              Agregue o elimine empresas de transporte disponibles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newTransportName.trim()) return;
                try {
                  const fd = new FormData();
                  fd.set('name', newTransportName.trim());
                  await createTransportAction(fd);
                  setNewTransportName('');
                  toast.success('Transporte agregado');
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : 'Error al agregar transporte');
                }
              }}
              className="flex gap-2"
            >
              <input
                value={newTransportName}
                onChange={(e) => setNewTransportName(e.target.value)}
                placeholder="Nombre del transporte"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </form>
            <div className="divide-y rounded-lg border">
              {transports.length === 0 && (
                <p className="px-3 py-4 text-sm text-gray-500 text-center">No hay transportes configurados</p>
              )}
              {transports.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-gray-900">{t.name}</span>
                  <button
                    onClick={async () => {
                      try {
                        await deleteTransportAction(t.id);
                        toast.success('Transporte eliminado');
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : 'Error al eliminar');
                      }
                    }}
                    className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                    title="Eliminar transporte"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
