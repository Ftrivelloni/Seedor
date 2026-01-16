'use client';

import { useState } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Card, CardContent } from '@/components/dashboard/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/dashboard/ui/table';
import { Badge } from '@/components/dashboard/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/dashboard/ui/dialog';
import { Label } from '@/components/dashboard/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/ui/select';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner';

export default function InventarioInsumos() {
    const { insumos, depositos, agregarMovimiento } = useAppContext();
    const [busqueda, setBusqueda] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [movimiento, setMovimiento] = useState({
        tipo: '',
        insumo: '',
        cantidad: '',
        depositoOrigen: '',
        depositoDestino: '',
    });

    const insumosFiltrados = insumos.filter((i) =>
        i.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'ok':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'bajo':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'sin stock':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return null;
        }
    };

    const getRowClassName = (estado: string) => {
        switch (estado) {
            case 'bajo':
                return 'bg-yellow-50 hover:bg-yellow-100';
            case 'sin stock':
                return 'bg-red-50 hover:bg-red-100';
            default:
                return '';
        }
    };

    const handleRegistrarMovimiento = () => {
        agregarMovimiento({
            id: `M${Date.now()}`,
            ...movimiento,
            fecha: new Date().toISOString().split('T')[0],
            usuario: 'Juan Pérez',
        });
        toast.success('Movimiento registrado');
        setOpenDialog(false);
        setMovimiento({
            tipo: '',
            insumo: '',
            cantidad: '',
            depositoOrigen: '',
            depositoDestino: '',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Insumos</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Control de stock y movimientos
                    </p>
                </div>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Registrar movimiento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar movimiento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipo de movimiento</Label>
                                <Select value={movimiento.tipo} onValueChange={(v) => setMovimiento((p) => ({ ...p, tipo: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ingreso">Ingreso</SelectItem>
                                        <SelectItem value="Consumo">Consumo</SelectItem>
                                        <SelectItem value="Traslado">Traslado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Insumo</Label>
                                <Select value={movimiento.insumo} onValueChange={(v) => setMovimiento((p) => ({ ...p, insumo: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {insumos.map((i) => (
                                            <SelectItem key={i.id} value={i.nombre}>
                                                {i.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Cantidad</Label>
                                <Input
                                    type="number"
                                    value={movimiento.cantidad}
                                    onChange={(e) => setMovimiento((p) => ({ ...p, cantidad: e.target.value }))}
                                />
                            </div>
                            {movimiento.tipo !== 'Ingreso' && (
                                <div className="space-y-2">
                                    <Label>Depósito origen</Label>
                                    <Select value={movimiento.depositoOrigen} onValueChange={(v) => setMovimiento((p) => ({ ...p, depositoOrigen: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {depositos.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {movimiento.tipo === 'Traslado' && (
                                <div className="space-y-2">
                                    <Label>Depósito destino</Label>
                                    <Select value={movimiento.depositoDestino} onValueChange={(v) => setMovimiento((p) => ({ ...p, depositoDestino: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {depositos.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button onClick={handleRegistrarMovimiento} className="w-full">
                                Registrar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Buscar insumo..."
                            className="pl-10"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Insumo</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Stock total</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Mínimo</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {insumosFiltrados.map((insumo) => (
                                <TableRow key={insumo.id} className={getRowClassName(insumo.estado)}>
                                    <TableCell className="font-medium">{insumo.nombre}</TableCell>
                                    <TableCell>{insumo.categoria}</TableCell>
                                    <TableCell>{insumo.stockTotal}</TableCell>
                                    <TableCell>{insumo.unidad}</TableCell>
                                    <TableCell>{insumo.minimo}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getEstadoIcon(insumo.estado)}
                                            <Badge
                                                variant={
                                                    insumo.estado === 'ok'
                                                        ? 'secondary'
                                                        : insumo.estado === 'bajo'
                                                            ? 'default'
                                                            : 'destructive'
                                                }
                                            >
                                                {insumo.estado}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
