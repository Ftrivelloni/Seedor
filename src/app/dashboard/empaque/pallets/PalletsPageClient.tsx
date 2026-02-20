'use client';

import { useState } from 'react';
import {
  Package,
  Layers,
  QrCode,
  Plus,
  CheckCircle2,
  Printer,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/dashboard/ui/badge';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { StateCard } from '@/components/dashboard/StateCard';
import { createPalletAction } from '../actions';
import { printBoxTarjeton, printPalletTarjeton, printMultipleBoxTarjetones } from '../pdf-tarjetones';
import type { SerializedBox, SerializedPallet } from '../types';

interface Props {
  availableBoxes: SerializedBox[];
  pallets: SerializedPallet[];
}

export function PalletsPageClient({ availableBoxes, pallets }: Props) {
  const [activeTab, setActiveTab] = useState('cajas');
  const [showPallet, setShowPallet] = useState(false);
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [destinoFilter, setDestinoFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [operatorName, setOperatorName] = useState('');

  // KPIs
  const totalAvailableBoxes = availableBoxes.length;
  const palletsOnFloor = pallets.filter((p) => p.status === 'ON_FLOOR').length;
  const totalBoxesInPallets = pallets.reduce((acc, p) => acc + p.boxCount, 0);
  const totalWeight = pallets.reduce((acc, p) => acc + p.totalWeight, 0);

  // Filtered boxes
  const filteredBoxes = availableBoxes.filter((b) => {
    const matchSearch = !search || b.code.toLowerCase().includes(search.toLowerCase()) || b.product.toLowerCase().includes(search.toLowerCase());
    const matchDestino = destinoFilter === 'ALL' || b.destination === destinoFilter;
    return matchSearch && matchDestino;
  });

  function toggleBox(id: string) {
    setSelectedBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedBoxIds.size === filteredBoxes.length) {
      setSelectedBoxIds(new Set());
    } else {
      setSelectedBoxIds(new Set(filteredBoxes.map((b) => b.id)));
    }
  }

  const selectedBoxes = availableBoxes.filter((b) => selectedBoxIds.has(b.id));
  const selectedWeight = selectedBoxes.reduce((acc, b) => acc + b.weightKg, 0);

  // Compatibility check: all selected boxes should share the same destination
  const destinations = new Set(selectedBoxes.map((b) => b.destination));
  const isCompatible = destinations.size <= 1;

  async function handleCreatePallet(andPrint: boolean) {
    if (selectedBoxIds.size === 0) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('boxIds', JSON.stringify(Array.from(selectedBoxIds)));
      fd.set('operatorName', operatorName);
      await createPalletAction(fd);
      toast.success(`Pallet creado con ${selectedBoxIds.size} cajas${andPrint ? ' — Imprimiendo etiqueta...' : ''}`);
      setShowPallet(false);
      setSelectedBoxIds(new Set());
      setOperatorName('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al crear pallet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StateCard
          title="Cajas Disponibles"
          value={totalAvailableBoxes}
          icon={Package}
          iconColor="text-green-600"
        />
        <StateCard
          title="Pallets en Piso"
          value={palletsOnFloor}
          icon={Layers}
          iconColor="text-blue-600"
        />
        <StateCard
          title="Cajas en Pallets"
          value={totalBoxesInPallets}
          icon={Package}
          iconColor="text-purple-600"
        />
        <StateCard
          title="Peso Total Pallets"
          value={`${totalWeight.toLocaleString('es-AR')} kg`}
          icon={Layers}
          iconColor="text-orange-600"
        />
      </section>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="cajas" className="gap-1">
              <Package className="h-4 w-4" />
              Cajas Disponibles ({totalAvailableBoxes})
            </TabsTrigger>
            <TabsTrigger value="pallets" className="gap-1">
              <Layers className="h-4 w-4" />
              Pallets en Piso ({palletsOnFloor})
            </TabsTrigger>
          </TabsList>

          {activeTab === 'cajas' && selectedBoxIds.size > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => printMultipleBoxTarjetones(selectedBoxes)}
                className="text-gray-700 border-gray-300"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Tarjetones ({selectedBoxIds.size})
              </Button>
              <Button
                onClick={() => setShowPallet(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Layers className="h-4 w-4 mr-2" />
                Armar Pallet ({selectedBoxIds.size} cajas)
              </Button>
            </div>
          )}
        </div>

        {/* Cajas Tab */}
        <TabsContent value="cajas" className="mt-4">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código o producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={destinoFilter} onValueChange={setDestinoFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los destinos</SelectItem>
                <SelectItem value="MERCADO_INTERNO">Mercado Interno</SelectItem>
                <SelectItem value="EXPORTACION">Exportación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredBoxes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                <Package className="h-8 w-8 text-gray-400" />
                <p className="text-muted-foreground">No hay cajas disponibles para paletizar.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedBoxIds.size === filteredBoxes.length && filteredBoxes.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Calibre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Envase</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBoxes.map((b) => (
                    <TableRow
                      key={b.id}
                      className={selectedBoxIds.has(b.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedBoxIds.has(b.id)}
                          onCheckedChange={() => toggleBox(b.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{b.code}</TableCell>
                      <TableCell>{b.product}</TableCell>
                      <TableCell>{b.caliber}</TableCell>
                      <TableCell>{b.category}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.packagingCode || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={b.destination === 'EXPORTACION' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                          {b.destination === 'EXPORTACION' ? 'Exportación' : 'Mercado Int.'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{b.weightKg}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => { e.stopPropagation(); printBoxTarjeton(b); }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          title="Imprimir tarjetón"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Pallets Tab */}
        <TabsContent value="pallets" className="mt-4">
          {pallets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                <Layers className="h-8 w-8 text-gray-400" />
                <p className="text-muted-foreground">No hay pallets armados aún.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pallets.map((p) => (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">{p.code}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          p.status === 'ON_FLOOR'
                            ? 'bg-blue-100 text-blue-700'
                            : p.status === 'DISPATCHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {p.status === 'ON_FLOOR' ? 'En Piso' : p.status === 'DISPATCHED' ? 'Despachado' : p.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <QrCode className="h-10 w-10 text-gray-300" />
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm flex-1">
                        <div>
                          <p className="text-xs text-muted-foreground">Cajas</p>
                          <p className="font-semibold">{p.boxCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Peso</p>
                          <p className="font-semibold">{p.totalWeight.toLocaleString('es-AR')} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Operador</p>
                          <p className="font-medium">{p.operatorName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fecha</p>
                          <p className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('es-AR')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Box summary */}
                    {p.boxes.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-1">
                        {p.boxes.slice(0, 3).map((bx) => (
                          <div key={bx.id} className="flex justify-between">
                            <span className="font-mono">{bx.code}</span>
                            <span>{bx.product} · {bx.caliber} · {bx.weightKg}kg</span>
                          </div>
                        ))}
                        {p.boxes.length > 3 && (
                          <p className="text-muted-foreground text-center">
                            +{p.boxes.length - 3} cajas más...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Print tarjetón */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => printPalletTarjeton(p)}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Imprimir Tarjetón
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Pallet Modal */}
      <Dialog open={showPallet} onOpenChange={setShowPallet}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Armar Pallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Compatibility warning */}
            {!isCompatible && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Las cajas seleccionadas tienen destinos diferentes. Se recomienda agrupar cajas del mismo destino.</p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cajas seleccionadas</span>
                <span className="font-semibold">{selectedBoxIds.size}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Peso total</span>
                <span className="font-semibold">{selectedWeight.toLocaleString('es-AR')} kg</span>
              </div>
            </div>

            {/* Selected boxes list */}
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
              {selectedBoxes.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                  <span className="font-mono">{b.code}</span>
                  <span className="text-muted-foreground">{b.product} · {b.caliber} · {b.weightKg}kg</span>
                </div>
              ))}
            </div>

            {/* QR placeholder */}
            <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
              <QrCode className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-700">Código QR</p>
                <p className="text-xs text-blue-500">Se generará automáticamente al crear el pallet</p>
              </div>
            </div>

            {/* Operator */}
            <div className="space-y-2">
              <Label htmlFor="operatorName">Operador</Label>
              <Input
                id="operatorName"
                placeholder="Nombre del operador"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPallet(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleCreatePallet(false)}
                disabled={loading || selectedBoxIds.size === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Crear Pallet
              </Button>
              <Button
                onClick={() => handleCreatePallet(true)}
                disabled={loading || selectedBoxIds.size === 0}
                variant="outline"
                className="text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                <Printer className="h-4 w-4 mr-1" />
                Crear e Imprimir
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
