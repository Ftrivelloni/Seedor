'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Bell, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Label } from '@/components/dashboard/ui/label';
import { Input } from '@/components/dashboard/ui/input';
import { Switch } from '@/components/dashboard/ui/switch';
import { Button } from '@/components/dashboard/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { Separator } from '@/components/dashboard/ui/separator';

export default function Configuracion() {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    // Client-side role check — server-side guard is in layout/middleware
    useEffect(() => {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then((data: { role?: string }) => {
          if (data.role !== 'ADMIN') {
            router.replace('/dashboard');
          } else {
            setChecked(true);
          }
        })
        .catch(() => router.replace('/dashboard'));
    }, [router]);

    if (!checked) return null;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Configuración</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Personaliza tu experiencia en Seedor
                </p>
            </div>

            <Tabs defaultValue="perfil">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="perfil">
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="notificaciones">
                        <Bell className="mr-2 h-4 w-4" />
                        Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="seguridad">
                        <Shield className="mr-2 h-4 w-4" />
                        Seguridad
                    </TabsTrigger>
                    <TabsTrigger value="general">
                        <Settings className="mr-2 h-4 w-4" />
                        General
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="perfil" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información personal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre completo</Label>
                                    <Input id="nombre" defaultValue="Juan Pérez" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue="juan.perez@seedor.com" />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input id="telefono" defaultValue="+54 351 1234567" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rol">Rol</Label>
                                    <Input id="rol" defaultValue="Encargado" disabled />
                                </div>
                            </div>
                            <Separator />
                            <Button>Guardar cambios</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notificaciones" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferencias de notificaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Alertas de stock</p>
                                    <p className="text-sm text-gray-600">
                                        Recibir notificaciones cuando el stock esté bajo
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Tareas próximas</p>
                                    <p className="text-sm text-gray-600">
                                        Recordatorios de tareas programadas
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Mantenimiento maquinaria</p>
                                    <p className="text-sm text-gray-600">
                                        Alertas de service y mantenimientos
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Ventas y pagos</p>
                                    <p className="text-sm text-gray-600">
                                        Notificaciones de órdenes y cobros
                                    </p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seguridad" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Seguridad de la cuenta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password-actual">Contraseña actual</Label>
                                <Input id="password-actual" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-nueva">Nueva contraseña</Label>
                                <Input id="password-nueva" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-confirmar">Confirmar contraseña</Label>
                                <Input id="password-confirmar" type="password" />
                            </div>
                            <Separator />
                            <Button>Cambiar contraseña</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración general</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Modo oscuro</p>
                                    <p className="text-sm text-gray-600">
                                        Activar tema oscuro en la interfaz
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Idioma</p>
                                    <p className="text-sm text-gray-600">Español (Argentina)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
