'use client';

import { useState, useEffect } from 'react';
import {
  Cog,
  Play,
  Pause,
  CheckCircle2,
  Plus,
  Package,
  Trash2,
  FlaskConical,
  ArrowRight,
  Timer,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/dashboard/ui/badge';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import { Textarea } from '@/components/dashboard/ui/textarea';
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
import {
  createProcessSessionAction,
  addBinToProcessAction,
  registerProcessProductAction,
  registerDiscardAction,
  finalizeProcessSessionAction,
  createBoxAction,
} from '../actions';
import type { SerializedProcessSession, SerializedBin, SerializedBox } from '../types';
import { processStatusLabels, binStatusLabels } from '../types';

interface Props {
  activeSession: (SerializedProcessSession & { inputBins: SerializedBin[]; boxes: SerializedBox[] }) | null;
  history: SerializedProcessSession[];
  availableBins: SerializedBin[];
}

const processFlowSteps = [
  { label: 'Volcado', icon: '🪣' },
  { label: 'Lavado', icon: '💧' },
  { label: 'Cera / Jabón', icon: '🧴' },
  { label: 'Calibrado', icon: '📏' },
  { label: 'Empaque', icon: '📦' },
];

export function ProcesoPageClient({ activeSession, history, availableBins }: Props) {
  const [showAddBin, setShowAddBin] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  // Live timer
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'IN_PROGRESS') return;
    const start = new Date(activeSession.startTime).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [activeSession]);

  // KPI computations
  const totalInputKg = activeSession?.inputBins.reduce((a, b) => a + b.netWeight, 0) ?? 0;
  const boxCount = activeSession?.boxes.length ?? 0;
  const totalBoxKg = activeSession?.boxes.reduce((a, b) => a + b.weightKg, 0) ?? 0;
  const cleanDiscard = activeSession?.cleanDiscardKg ?? 0;
  const contaminatedDiscard = activeSession?.contaminatedDiscardKg ?? 0;
  const totalDiscard = cleanDiscard + contaminatedDiscard;
  const efficiency = totalInputKg > 0 ? Math.round(((totalBoxKg) / totalInputKg) * 100) : 0;

  async function handleStartSession() {
    setLoading(true);
    try {
      await createProcessSessionAction();
      toast.success('Sesión de proceso iniciada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalizeSession() {
    if (!activeSession) return;
    setLoading(true);
    try {
      await finalizeProcessSessionAction(activeSession.id);
      toast.success('Sesión de proceso finalizada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al finalizar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBin(binId: string) {
    if (!activeSession) return;
    setLoading(true);
    try {
      await addBinToProcessAction(activeSession.id, binId);
      toast.success('Bin agregado al proceso');
      setShowAddBin(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al agregar bin');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('processSessionId', activeSession!.id);
      await registerProcessProductAction(fd);
      toast.success('Producto/insumo registrado');
      setShowProduct(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar producto');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterDiscard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('processSessionId', activeSession!.id);
      await registerDiscardAction(fd);
      toast.success('Descarte registrado');
      setShowDiscard(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar descarte');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBox(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('processSessionId', activeSession!.id);
      await createBoxAction(fd);
      toast.success('Caja generada exitosamente');
      setShowBox(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al generar caja');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StateCard
          title="Bines en Proceso"
          value={activeSession?.inputBins.length ?? 0}
          icon={Package}
          iconColor="text-purple-600"
        />
        <StateCard
          title="Kg Procesados"
          value={totalInputKg.toLocaleString('es-AR')}
          icon={TrendingUp}
          iconColor="text-purple-600"
        />
        <StateCard
          title="Cajas Generadas"
          value={boxCount}
          icon={Package}
          iconColor="text-green-600"
        />
        <StateCard
          title="Descarte Contam."
          value={`${contaminatedDiscard} kg`}
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
        <StateCard
          title="Eficiencia"
          value={`${efficiency}%`}
          icon={TrendingUp}
          iconColor="text-yellow-600"
        />
      </section>

      {/* Active Session or Start */}
      {activeSession && activeSession.status !== 'COMPLETED' ? (
        <Card className="border-purple-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Cog className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Proceso Activo — {activeSession.code}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Estado:{' '}
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 ml-1">
                    {processStatusLabels[activeSession.status] || activeSession.status}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-1.5">
                <Timer className="h-4 w-4 text-purple-600" />
                <span className="font-mono text-lg font-semibold text-purple-700">{elapsed}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleFinalizeSession}
                disabled={loading}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Finalizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Process Flow Visual */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              {processFlowSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{step.icon}</span>
                    <span className="text-xs font-medium text-gray-600">{step.label}</span>
                  </div>
                  {i < processFlowSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Duración</p>
                <p className="text-lg font-bold text-purple-700">{elapsed}</p>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Bines Entrada</p>
                <p className="text-lg font-bold">{activeSession.inputBins.length}</p>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Kg Ingresados</p>
                <p className="text-lg font-bold">{totalInputKg.toLocaleString('es-AR')}</p>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Cajas</p>
                <p className="text-lg font-bold">{boxCount}</p>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Descarte</p>
                <p className="text-lg font-bold text-red-600">{totalDiscard} kg</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Progreso de procesamiento</span>
                <span className="font-medium text-purple-700">{efficiency}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all"
                  style={{ width: `${Math.min(efficiency, 100)}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowAddBin(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Bin
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowProduct(true)}>
                <FlaskConical className="h-4 w-4 mr-1" />
                Registrar Producto
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowBox(true)} className="text-green-700 border-green-300 hover:bg-green-50">
                <Package className="h-4 w-4 mr-1" />
                Generar Caja
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDiscard(true)} className="text-red-700 border-red-300 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1" />
                Registrar Descarte
              </Button>
            </div>

            {/* Boxes Table */}
            {activeSession.boxes.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Calibre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead className="text-right">Peso (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSession.boxes.map((box) => (
                      <TableRow key={box.id}>
                        <TableCell className="font-mono text-sm">{box.code}</TableCell>
                        <TableCell>{box.product}</TableCell>
                        <TableCell>{box.caliber}</TableCell>
                        <TableCell>{box.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={box.destination === 'EXPORTACION' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                            {box.destination === 'EXPORTACION' ? 'Exportación' : 'Mercado Int.'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{box.weightKg}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Products list */}
            {activeSession.products.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <FlaskConical className="h-4 w-4 text-gray-500" />
                  Productos / Insumos Utilizados
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {activeSession.products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{p.productName}</span>
                      <span className="text-gray-500">
                        {p.quantity} {p.unit}
                        {p.cost != null && ` · $${p.cost}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="rounded-full bg-purple-100 p-4">
              <Cog className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">No hay proceso activo</h3>
              <p className="text-muted-foreground text-sm">
                Inicie una sesión de proceso para comenzar a procesar fruta.
              </p>
            </div>
            <Button onClick={handleStartSession} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Proceso
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Procesos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Bines</TableHead>
                    <TableHead>Cajas</TableHead>
                    <TableHead>Descarte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          {processStatusLabels[s.status] || s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(s.startTime).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>{s.totalDurationHours ? `${s.totalDurationHours}h` : '-'}</TableCell>
                      <TableCell>{s.inputBinCount}</TableCell>
                      <TableCell>{s.boxCount}</TableCell>
                      <TableCell className="text-red-600">
                        {s.cleanDiscardKg + s.contaminatedDiscardKg} kg
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Modals ── */}

      {/* Add Bin Modal */}
      <Dialog open={showAddBin} onOpenChange={setShowAddBin}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Bin al Proceso</DialogTitle>
          </DialogHeader>
          {availableBins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay bines disponibles (estado &quot;Listo para Proceso&quot;).
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {availableBins.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-gray-50"
                >
                  <div className="text-sm">
                    <p className="font-mono font-medium">{b.code}</p>
                    <p className="text-muted-foreground">
                      {b.fruitType} · {b.netWeight} kg · {b.fruitColor || 'Sin color'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAddBin(b.id)} disabled={loading}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Register Product Modal */}
      <Dialog open={showProduct} onOpenChange={setShowProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Producto / Insumo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Producto</Label>
              <Input id="productName" name="productName" placeholder="Ej: Cera, Jabón, Cloro" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Select name="unit" defaultValue="litros">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Costo (opcional)</Label>
              <Input id="cost" name="cost" type="number" step="0.01" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowProduct(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Discard Modal */}
      <Dialog open={showDiscard} onOpenChange={setShowDiscard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Descarte</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterDiscard} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cleanDiscardKg">Descarte Limpio (kg)</Label>
              <Input id="cleanDiscardKg" name="cleanDiscardKg" type="number" step="0.1" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contaminatedDiscardKg">Descarte Contaminado (kg)</Label>
              <Input id="contaminatedDiscardKg" name="contaminatedDiscardKg" type="number" step="0.1" min="0" defaultValue="0" />
              <p className="text-xs text-muted-foreground">
                El descarte contaminado requiere disposición especial (SENASA).
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDiscard(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                Registrar Descarte
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Box Modal */}
      <Dialog open={showBox} onOpenChange={setShowBox}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generar Nueva Caja</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBox} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto / Fruta</Label>
              <Input id="product" name="product" placeholder="Ej: Naranja, Limón, Mandarina" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="producer">Productor (opcional)</Label>
              <Input id="producer" name="producer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caliber">Calibre</Label>
                <Select name="caliber" defaultValue="40">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['36', '40', '48', '56', '64', '72', '80', '88', '100', '113'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select name="category" defaultValue="Primera">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Extra">Extra</SelectItem>
                    <SelectItem value="Primera">Primera</SelectItem>
                    <SelectItem value="Segunda">Segunda</SelectItem>
                    <SelectItem value="Tercera">Tercera</SelectItem>
                    <SelectItem value="Industria">Industria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packagingCode">Código Envase</Label>
                <Input id="packagingCode" name="packagingCode" placeholder="Ej: ENV-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Select name="destination" defaultValue="MERCADO_INTERNO">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MERCADO_INTERNO">Mercado Interno</SelectItem>
                    <SelectItem value="EXPORTACION">Exportación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso Neto (kg)</Label>
              <Input id="weightKg" name="weightKg" type="number" step="0.1" min="0.1" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBox(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                Generar Caja
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
