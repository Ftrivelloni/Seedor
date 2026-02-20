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
  Recycle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Eye,
  CircleDot,
  Printer,
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
import { printBoxTarjeton } from '../pdf-tarjetones';
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
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

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
          title="Descarte Especial"
          value={`${contaminatedDiscard} kg`}
          icon={Recycle}
          iconColor="text-orange-600"
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
                      <TableHead className="w-12"></TableHead>
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
                        <TableCell>
                          <button
                            onClick={() => printBoxTarjeton(box)}
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
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
          <CardContent className="py-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left side - illustration */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full bg-purple-100 flex items-center justify-center">
                    <Cog className="h-16 w-16 text-purple-400 animate-[spin_8s_linear_infinite]" />
                  </div>
                  <div className="absolute -top-2 -right-2 rounded-full bg-green-100 p-2">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="absolute -bottom-1 -left-3 rounded-full bg-orange-100 p-2">
                    <FlaskConical className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </div>
              {/* Right side - info & action */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Iniciar Sesión de Proceso</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Procese fruta clasificada: volcado, lavado, encerado, calibrado y empaque.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {processFlowSteps.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-1">
                      <span className="text-lg">{step.icon}</span>
                      <span className="text-xs text-gray-600">{step.label}</span>
                      {i < processFlowSteps.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-gray-300 ml-1" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <CircleDot className="h-4 w-4 text-purple-500" />
                    <span>{availableBins.length} bines disponibles</span>
                  </div>
                  <span>·</span>
                  <span>{history.length} sesiones anteriores</span>
                </div>
                <Button onClick={handleStartSession} disabled={loading} size="lg" className="bg-purple-600 hover:bg-purple-700 px-6">
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar Proceso
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Procesos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((s) => {
              const isExpanded = expandedHistory.has(s.id);
              const totalDisc = s.cleanDiscardKg + s.contaminatedDiscardKg;
              return (
                <div key={s.id} className="rounded-lg border overflow-hidden">
                  <button
                    onClick={() => {
                      setExpandedHistory((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.id)) next.delete(s.id);
                        else next.add(s.id);
                        return next;
                      });
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-mono font-medium text-sm text-gray-900">{s.code}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(s.startTime).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-sm">
                      <span className="text-gray-600">{s.totalDurationHours ? `${s.totalDurationHours}h` : '-'}</span>
                      <span className="text-gray-500">{s.inputBinCount} bines</span>
                      <span className="text-gray-500">{s.boxCount} cajas</span>
                      <span className="text-red-500">{totalDisc} kg desc.</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        {processStatusLabels[s.status] || s.status}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-gray-50 px-4 py-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Inicio</p>
                          <p className="font-medium">{new Date(s.startTime).toLocaleString('es-AR')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fin</p>
                          <p className="font-medium">{s.endTime ? new Date(s.endTime).toLocaleString('es-AR') : '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Descarte Limpio</p>
                          <p className="font-medium">{s.cleanDiscardKg} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Descarte Especial</p>
                          <p className="font-medium">{s.contaminatedDiscardKg} kg</p>
                        </div>
                      </div>

                      {/* Products if available */}
                      {s.products.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Productos / Insumos</p>
                          <div className="flex flex-wrap gap-2">
                            {s.products.map((p) => (
                              <span key={p.id} className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-700">
                                {p.productName} — {p.quantity} {p.unit}
                                {p.cost != null && ` · $${p.cost}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Notas</p>
                          <p className="text-sm text-gray-700">{s.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
              <Label htmlFor="contaminatedDiscardKg">Descarte Especial (kg)</Label>
              <Input id="contaminatedDiscardKg" name="contaminatedDiscardKg" type="number" step="0.1" min="0" defaultValue="0" />
              <p className="text-xs text-muted-foreground">
                El descarte especial requiere disposición diferenciada (SENASA).
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
