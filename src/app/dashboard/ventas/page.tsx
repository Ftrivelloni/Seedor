'use client';

import Link from 'next/link';
import { DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { StateCard } from '@/components/dashboard/StateCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/dashboard/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VentasOverview() {
    const { ordenes, clientes } = useAppContext();

    const totalVentas = ordenes.reduce((acc, o) => acc + o.total, 0);
    const ordenesActivas = ordenes.filter((o) => o.estado !== 'entregada').length;

    const ventasPorMes = [
        { mes: 'Ago', ventas: 45 },
        { mes: 'Sep', ventas: 52 },
        { mes: 'Oct', ventas: 61 },
        { mes: 'Nov', ventas: 58 },
        { mes: 'Dic', ventas: 70 },
        { mes: 'Ene', ventas: 68 },
    ];

    const formatMoney = (value: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Ventas</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Resumen de ventas y clientes
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StateCard
                    title="Ventas totales"
                    value={formatMoney(totalVentas)}
                    icon={DollarSign}
                    iconColor="text-green-600"
                />
                <StateCard
                    title="Órdenes activas"
                    value={ordenesActivas}
                    icon={ShoppingCart}
                    iconColor="text-blue-600"
                />
                <StateCard
                    title="Total clientes"
                    value={clientes.length}
                    icon={Users}
                    iconColor="text-purple-600"
                />
                <StateCard
                    title="Promedio venta"
                    value={formatMoney(totalVentas / ordenes.length)}
                    icon={TrendingUp}
                    iconColor="text-orange-600"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Evolución de ventas (millones)</CardTitle>
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

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Órdenes recientes</CardTitle>
                            <Link href="/dashboard/ventas/ordenes" className="text-sm text-green-600 hover:underline">
                                Ver todas
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {ordenes.slice(0, 5).map((orden) => (
                                <div key={orden.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="font-medium text-gray-900">{orden.producto}</p>
                                        <p className="text-sm text-gray-600">{orden.cantidad} {orden.unidad}</p>
                                        <p className="text-xs text-gray-400">{orden.fecha}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatMoney(orden.total)}</p>
                                        <Badge variant={orden.estado === 'entregada' ? 'secondary' : 'default'}>
                                            {orden.estado}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Top clientes</CardTitle>
                            <Link href="/dashboard/ventas/clientes" className="text-sm text-green-600 hover:underline">
                                Ver todos
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {clientes.map((cliente) => (
                                <div
                                    key={cliente.id}
                                    className={`flex items-start justify-between border-b pb-3 last:border-0 last:pb-0 rounded-lg p-2 -mx-2 ${cliente.deuda > 0 ? 'bg-red-50 border-red-200' : ''
                                        }`}
                                >
                                    <div className="space-y-1">
                                        <p className="font-medium text-gray-900">{cliente.nombre}</p>
                                        <p className="text-xs text-gray-500">{cliente.email}</p>
                                    </div>
                                    {cliente.deuda > 0 && (
                                        <Badge variant="destructive">Deuda: {formatMoney(cliente.deuda)}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
