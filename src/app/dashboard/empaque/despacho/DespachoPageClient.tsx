'use client';

import { useState } from 'react';
import {
  Truck,
  Package,
  FileText,
  AlertTriangle,
  Plus,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/dashboard/ui/badge';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import { Textarea } from '@/components/dashboard/ui/textarea';
import { Checkbox } from '@/components/dashboard/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/dashboard/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table';
import { StateCard } from '@/components/dashboard/StateCard';
import { createDispatchAction, updateDispatchStatusAction, createDispatchClientAction, deleteDispatchClientAction } from '../actions';
import type { SerializedDispatch, SerializedPallet, ConfigOption } from '../types';
import { dispatchStatusLabels, dispatchStatusColors } from '../types';

interface Props {
  dispatches: SerializedDispatch[];
  availablePallets: SerializedPallet[];
  clientOptions: ConfigOption[];
}

export function DespachoPageClient({ dispatches, availablePallets, clientOptions }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [showClients, setShowClients] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPalletIds, setSelectedPalletIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // KPIs
  const preparing = dispatches.filter((d) => d.status === 'PREPARING').length;
  const inTransit = dispatches.filter((d) => d.status === 'IN_TRANSIT').length;
  const delivered = dispatches.filter((d) => d.status === 'DELIVERED').length;
  const palletsAvailable = availablePallets.length;

  // Alert cards
  const preparingDispatches = dispatches.filter((d) => d.status === 'PREPARING');
  const hasAlerts = preparingDispatches.some((d) => d.palletCount === 0);

  // Filtered dispatches
  const filteredDispatches = dispatches.filter((d) => {
    const matchSearch =
      !search ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function togglePallet(id: string) {
    setSelectedPalletIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateDispatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('palletIds', JSON.stringify(Array.from(selectedPalletIds)));
      await createDispatchAction(fd);
      toast.success('Despacho creado exitosamente');
      setShowNew(false);
      setSelectedPalletIds(new Set());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear despacho');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(dispatchId: string, status: string) {
    try {
      await updateDispatchStatusAction(dispatchId, status);
      toast.success('Estado actualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar estado');
    }
  }

  async function handleCreateClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await createDispatchClientAction(fd);
      toast.success('Cliente creado');
      e.currentTarget.reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClient(id: string) {
    try {
      await deleteDispatchClientAction(id);
      toast.success('Cliente eliminado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const statusSequence = ['PREPARING', 'LOADED', 'IN_TRANSIT', 'DELIVERED'];

  function getNextStatus(current: string): string | null {
    const idx = statusSequence.indexOf(current);
    return idx >= 0 && idx < statusSequence.length - 1 ? statusSequence[idx + 1] : null;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StateCard
          title="Preparando"
          value={preparing}
          icon={Clock}
          iconColor="text-orange-600"
        />
        <StateCard
          title="En Tránsito"
          value={inTransit}
          icon={Truck}
          iconColor="text-purple-600"
        />
        <StateCard
          title="Entregados"
          value={delivered}
          icon={CheckCircle2}
          iconColor="text-green-600"
        />
        <StateCard
          title="Pallets Disponibles"
          value={palletsAvailable}
          icon={Package}
          iconColor="text-blue-600"
        />
      </section>

      {/* Alerts */}
      {hasAlerts && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              Hay despachos en preparación sin pallets asignados. Revise y asigne pallets antes del envío.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por código o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="PREPARING">Preparando</SelectItem>
              <SelectItem value="LOADED">Cargado</SelectItem>
              <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
              <SelectItem value="DELIVERED">Entregado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowClients(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Clientes
          </Button>
          <Button onClick={() => setShowNew(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Despacho
          </Button>
        </div>
      </div>

      {/* Dispatches Table */}
      {filteredDispatches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <Truck className="h-8 w-8 text-gray-400" />
            <p className="text-muted-foreground">No hay despachos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Pallets</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDispatches.map((d) => {
                const nextStatus = getNextStatus(d.status);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-sm font-medium">{d.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{d.clientName}</p>
                        {d.clientType && (
                          <p className="text-xs text-muted-foreground">{d.clientType}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.destination ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {d.destination}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{d.palletCount}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({d.boxCount} cajas)
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {d.dtv && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 text-xs">
                            DTV
                          </Badge>
                        )}
                        {d.dtc && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-600 text-xs">
                            DTC
                          </Badge>
                        )}
                        {d.remitoNumber && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 text-xs">
                            Remito
                          </Badge>
                        )}
                        {!d.dtv && !d.dtc && !d.remitoNumber && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={dispatchStatusColors[d.status] || 'bg-gray-100 text-gray-700'}>
                        {dispatchStatusLabels[d.status] || d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {nextStatus && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(d.id, nextStatus)}
                          className="text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {dispatchStatusLabels[nextStatus]}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dispatch Modal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Despacho</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDispatch} className="space-y-6">
            {/* Client Data */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Datos del Cliente
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Cliente *</Label>
                  {clientOptions.length > 0 ? (
                    <Select name="clientName" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientOptions.map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="clientName" name="clientName" required />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientType">Tipo de Cliente</Label>
                  <Select name="clientType">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mayorista">Mayorista</SelectItem>
                      <SelectItem value="Minorista">Minorista</SelectItem>
                      <SelectItem value="Exportador">Exportador</SelectItem>
                      <SelectItem value="Industria">Industria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleType">Tipo de Venta</Label>
                  <Select name="saleType">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consignación">Consignación</SelectItem>
                      <SelectItem value="Venta Directa">Venta Directa</SelectItem>
                      <SelectItem value="Exportación">Exportación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Dirección de Entrega</Label>
                  <Input id="deliveryAddress" name="deliveryAddress" />
                </div>
              </div>
            </div>

            {/* Transport Data */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                Datos de Transporte
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input id="destination" name="destination" placeholder="Ciudad / Mercado" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discharge">Descarga</Label>
                  <Input id="discharge" name="discharge" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport">Transporte</Label>
                  <Input id="transport" name="transport" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverName">Chofer</Label>
                  <Input id="driverName" name="driverName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Patente</Label>
                  <Input id="licensePlate" name="licensePlate" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingCode">Código de Cierre</Label>
                  <Input id="closingCode" name="closingCode" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Fecha de Salida</Label>
                  <Input id="departureDate" name="departureDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Hora de Salida</Label>
                  <Input id="departureTime" name="departureTime" type="time" />
                </div>
              </div>
            </div>

            {/* Pallets */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                Pallets ({selectedPalletIds.size} seleccionados)
              </h4>
              {availablePallets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center bg-gray-50 rounded-lg">
                  No hay pallets disponibles en piso.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {availablePallets.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                        selectedPalletIds.has(p.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedPalletIds.has(p.id)}
                        onCheckedChange={() => togglePallet(p.id)}
                      />
                      <div className="flex-1 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-mono font-medium">{p.code}</span>
                          <span className="text-muted-foreground ml-2">
                            {p.boxCount} cajas · {p.totalWeight.toLocaleString('es-AR')} kg
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Documentation */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Documentación
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="remitoNumber">Nº Remito</Label>
                  <Input id="remitoNumber" name="remitoNumber" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dtv">DTV</Label>
                  <Input id="dtv" name="dtv" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dtc">DTC</Label>
                  <Input id="dtc" name="dtc" />
                </div>
              </div>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea id="observations" name="observations" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                Crear Despacho
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Clients Modal */}
      <Dialog open={showClients} onOpenChange={setShowClients}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar Clientes de Despacho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleCreateClient} className="flex gap-2">
              <Input name="name" placeholder="Nuevo cliente..." required className="flex-1" />
              <Button type="submit" disabled={loading} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </form>
            {clientOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay clientes configurados aún.
              </p>
            ) : (
              <div className="space-y-2">
                {clientOptions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    <button
                      onClick={() => handleDeleteClient(c.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                      title="Eliminar cliente"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
