'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/dashboard/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/dashboard/ui/select';
import { Badge } from '@/components/dashboard/ui/badge';
import { useAppContext } from '@/context/AppContext';

export default function CampoOverview() {
    const router = useRouter();
    const { campos, lotes, tareas, campoActivo, setCampoActivo } = useAppContext();
    const [selectedCampo, setSelectedCampo] = useState(campoActivo);

    const campoSeleccionado = campos.find((c) => c.id === selectedCampo);
    const lotesDelCampo = lotes.filter((l) => l.campoId === selectedCampo);
    const tareasPendientes = tareas.filter((t) => t.estado === 'pendiente').slice(0, 4);

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'alta':
                return 'bg-red-100 border-red-300';
            case 'media':
                return 'bg-yellow-100 border-yellow-300';
            case 'ok':
                return 'bg-green-100 border-green-300';
            default:
                return 'bg-gray-100 border-gray-300';
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'alta':
                return 'Atención alta';
            case 'media':
                return 'Atención media';
            case 'ok':
                return 'OK';
            default:
                return estado;
        }
    };

    const handleCampoChange = (value: string) => {
        setSelectedCampo(value);
        setCampoActivo(value);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Campo</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Gestión de lotes y tareas de campo
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard/campo/crear-tarea')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear tarea
                </Button>
            </div>

            {/* Selector de campo */}
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Campo:</span>
                <Select value={selectedCampo} onValueChange={handleCampoChange}>
                    <SelectTrigger className="w-64">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {campos.map((campo) => (
                            <SelectItem key={campo.id} value={campo.id}>
                                {campo.nombre} - {campo.ubicacion}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Vista de lotes */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Lotes de {campoSeleccionado?.nombre}</CardTitle>
                        <Link
                            href="/dashboard/campo/lotes"
                            className="text-sm text-green-600 hover:underline"
                        >
                            Ver en tabla
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {lotesDelCampo.map((lote) => (
                            <Link
                                key={lote.id}
                                href={`/dashboard/campo/lote/${lote.id}`}
                                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${getEstadoColor(
                                    lote.estado
                                )}`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {lote.nombre}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {lote.hectareas} ha
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                lote.estado === 'alta'
                                                    ? 'destructive'
                                                    : lote.estado === 'media'
                                                        ? 'default'
                                                        : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {getEstadoLabel(lote.estado)}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Tareas abiertas:</span>
                                            <span className="font-medium">{lote.tareasAbiertas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Rendimiento:</span>
                                            <span className="font-medium">{lote.rendimiento}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Último trabajo:</span>
                                            <span className="font-medium">{lote.ultimoTrabajo}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Tareas próximas */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Tareas próximas</CardTitle>
                            <Link
                                href="/dashboard/campo/calendario"
                                className="text-sm text-green-600 hover:underline"
                            >
                                Ver calendario
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tareasPendientes.map((tarea) => (
                                <Link
                                    key={tarea.id}
                                    href={`/dashboard/campo/tarea/${tarea.id}`}
                                    className="block rounded-lg border p-3 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium text-gray-900">
                                                {tarea.descripcion}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {tarea.tipo.charAt(0).toUpperCase() + tarea.tipo.slice(1)} •{' '}
                                                {tarea.lotes.length} lote(s)
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {tarea.fechaInicio} - {tarea.fechaFin}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                tarea.prioridad === 'alta' ? 'destructive' : 'default'
                                            }
                                        >
                                            {tarea.prioridad}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Alertas y resumen */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen del campo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="rounded-lg bg-blue-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-blue-900">Rendimiento</p>
                                        <p className="mt-1 text-sm text-blue-700">
                                            Promedio del campo:{' '}
                                            {Math.round(
                                                lotesDelCampo.reduce((acc, l) => acc + l.rendimiento, 0) /
                                                lotesDelCampo.length
                                            )}
                                            %
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-green-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-green-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-green-900">Hectáreas</p>
                                        <p className="mt-1 text-sm text-green-700">
                                            Total: {campoSeleccionado?.hectareasTotales} ha • En lotes:{' '}
                                            {lotesDelCampo.reduce((acc, l) => acc + l.hectareas, 0)} ha
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-yellow-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-yellow-900">Atención requerida</p>
                                        <p className="mt-1 text-sm text-yellow-700">
                                            {lotesDelCampo.filter((l) => l.estado !== 'ok').length} lote(s)
                                            requieren atención
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
