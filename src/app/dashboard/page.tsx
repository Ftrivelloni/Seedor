'use client';

import Link from 'next/link';
import { TrendingUp, AlertTriangle, Package, CalendarClock } from 'lucide-react';
import { StateCard } from '@/components/dashboard/StateCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/dashboard/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
    const { lotes, tareas, alertas, ordenes } = useAppContext();

    const tareasActivas = tareas.filter((t) => t.estado !== 'completada').length;
    const alertasActivas = alertas.filter((a) => a.estado === 'activa').length;
    const ordenesActivas = ordenes.filter((o) => o.estado !== 'entregada').length;

    const rendimientoPorLote = lotes.slice(0, 6).map((l) => ({
        nombre: l.nombre,
        rendimiento: l.rendimiento,
    }));

    const ventasPorMes = [
        { mes: 'Ago', ventas: 45 },
        { mes: 'Sep', ventas: 52 },
        { mes: 'Oct', ventas: 61 },
        { mes: 'Nov', ventas: 58 },
        { mes: 'Dic', ventas: 70 },
        { mes: 'Ene', ventas: 68 },
    ];

    const tareasPendientes = tareas
        .filter((t) => t.estado === 'pendiente')
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Resumen general de tu operación agrícola
                </p>
            </div>

            {/* Cards principales */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StateCard
                    title="Tareas activas"
                    value={tareasActivas}
                    icon={CalendarClock}
                    iconColor="text-blue-600"
                    trend={{ value: '+12% vs mes anterior', positive: true }}
                />
                <StateCard
                    title="Alertas de stock"
                    value={alertasActivas}
                    icon={AlertTriangle}
                    iconColor="text-orange-600"
                />
                <StateCard
                    title="Órdenes activas"
                    value={ordenesActivas}
                    icon={Package}
                    iconColor="text-purple-600"
                />
                <StateCard
                    title="Rendimiento promedio"
                    value="89%"
                    icon={TrendingUp}
                    iconColor="text-green-600"
                    trend={{ value: '+5% vs campaña anterior', positive: true }}
                />
            </div>

            {/* Gráficos */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Rendimiento por lote</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={rendimientoPorLote}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nombre" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="rendimiento" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ventas últimos 6 meses (millones)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={ventasPorMes}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Tareas próximas y alertas */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Tareas próximas</CardTitle>
                            <Link
                                href="/dashboard/campo/calendario"
                                className="text-sm text-green-600 hover:underline"
                            >
                                Ver todas
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tareasPendientes.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-8">
                                    No hay tareas pendientes
                                </p>
                            ) : (
                                tareasPendientes.map((tarea) => (
                                    <div
                                        key={tarea.id}
                                        className={`flex items-start justify-between border-b pb-4 last:border-0 last:pb-0 rounded-lg p-2 -mx-2 ${tarea.prioridad === 'alta'
                                                ? 'bg-red-50 border-red-200'
                                                : tarea.prioridad === 'media'
                                                    ? 'bg-amber-50 border-amber-200'
                                                    : ''
                                            }`}
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium text-gray-900">
                                                {tarea.descripcion}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {tarea.lotes.length} lote(s) • {tarea.trabajadores.join(', ')}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {tarea.fechaInicio} - {tarea.fechaFin}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                tarea.prioridad === 'alta'
                                                    ? 'destructive'
                                                    : tarea.prioridad === 'media'
                                                        ? 'default'
                                                        : 'secondary'
                                            }
                                        >
                                            {tarea.prioridad}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Alertas recientes</CardTitle>
                            <Link
                                href="/dashboard/inventario/alertas"
                                className="text-sm text-green-600 hover:underline"
                            >
                                Ver todas
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {alertas.slice(0, 5).map((alerta) => (
                                <div
                                    key={alerta.id}
                                    className={`flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0 rounded-lg p-2 -mx-2 ${alerta.tipo === 'Sin stock'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-amber-50 border-amber-200'
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${alerta.tipo === 'Sin stock' ? 'bg-red-100' : 'bg-amber-100'
                                        }`}>
                                        <AlertTriangle className={`h-4 w-4 ${alerta.tipo === 'Sin stock' ? 'text-red-600' : 'text-amber-600'
                                            }`} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium text-gray-900">{alerta.tipo}</p>
                                        <p className="text-sm text-gray-600">{alerta.insumo}</p>
                                        <p className="text-xs text-gray-400">
                                            Stock: {alerta.stockActual} / Mínimo: {alerta.minimo}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
