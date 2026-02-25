import { requireRole } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import Link from 'next/link';
import { ArrowLeft, HardHat } from 'lucide-react';

export default async function ConfiguracionTrabajadoresPage() {
  await requireRole(['ADMIN']);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/configuracion"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Configuración
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <HardHat className="h-5 w-5 text-orange-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Trabajadores</h1>
          <p className="text-sm text-gray-500">Definí los parámetros específicos del módulo Trabajadores.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de pago</CardTitle>
          <CardDescription>
            Configurá las modalidades de pago disponibles para los trabajadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás personalizar los tipos de pago y sus tarifas base desde acá.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funciones laborales</CardTitle>
          <CardDescription>
            Administrá las funciones y roles operativos disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás definir funciones personalizadas para tus trabajadores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
