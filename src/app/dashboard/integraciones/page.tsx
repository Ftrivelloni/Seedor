'use client';

import { Zap, Check, MessageSquare, Webhook, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/dashboard/ui/badge';
import { Switch } from '@/components/dashboard/ui/switch';

export default function Integraciones() {
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Integraciones</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Conecta Seedor con tus herramientas favoritas
                </p>
            </div>

            <div className="grid gap-6">
                {/* n8n */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                                    <Webhook className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <CardTitle>n8n Automation</CardTitle>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Automatiza workflows y procesos personalizados
                                    </p>
                                    <Badge variant="secondary" className="mt-2">
                                        <Check className="mr-1 h-3 w-3" />
                                        Conectado
                                    </Badge>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-900">
                                Automatizaciones activas:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-orange-600" />
                                    Envío automático de avisos de tareas
                                </li>
                                <li className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-orange-600" />
                                    Alertas de stock bajo
                                </li>
                                <li className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-orange-600" />
                                    Notificaciones de service maquinaria
                                </li>
                            </ul>
                            <Button variant="outline" size="sm" className="mt-2">
                                Configurar workflows
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* WhatsApp */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                    <MessageSquare className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle>WhatsApp Business</CardTitle>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Envía notificaciones y recordatorios por WhatsApp
                                    </p>
                                    <Badge variant="secondary" className="mt-2">
                                        <Check className="mr-1 h-3 w-3" />
                                        Conectado
                                    </Badge>
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-900">
                                Configuración actual:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Número configurado: +54 351 XXXXXX</li>
                                <li>• Mensajes enviados este mes: 45</li>
                                <li>• Trabajadores notificados: 4</li>
                            </ul>
                            <Button variant="outline" size="sm" className="mt-2">
                                Gestionar configuración
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* API */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                    <Database className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>API REST</CardTitle>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Integra Seedor con tus aplicaciones personalizadas
                                    </p>
                                    <Badge variant="outline" className="mt-2">
                                        Disponible
                                    </Badge>
                                </div>
                            </div>
                            <Button variant="outline">Ver documentación</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-900">
                                Información de acceso:
                            </p>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Endpoint:</span>
                                    <code className="rounded bg-gray-200 px-2 py-1">
                                        api.seedor.com/v1
                                    </code>
                                </div>
                                <div className="flex justify-between">
                                    <span>API Key:</span>
                                    <code className="rounded bg-gray-200 px-2 py-1">
                                        sk_test_XXXXXXXXXXXXXXXX
                                    </code>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2">
                                Generar nueva API Key
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Más integraciones próximamente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border p-4 text-center opacity-50">
                            <p className="font-medium text-gray-900">Google Calendar</p>
                            <p className="mt-1 text-xs text-gray-500">Próximamente</p>
                        </div>
                        <div className="rounded-lg border p-4 text-center opacity-50">
                            <p className="font-medium text-gray-900">Mercado Pago</p>
                            <p className="mt-1 text-xs text-gray-500">Próximamente</p>
                        </div>
                        <div className="rounded-lg border p-4 text-center opacity-50">
                            <p className="font-medium text-gray-900">Zapier</p>
                            <p className="mt-1 text-xs text-gray-500">Próximamente</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
