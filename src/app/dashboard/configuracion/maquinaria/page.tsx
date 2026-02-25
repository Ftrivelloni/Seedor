import { requireRole } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import Link from 'next/link';
import { ArrowLeft, Wrench } from 'lucide-react';

export default async function ConfiguracionMaquinariaPage() {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
          <Wrench className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Maquinaria</h1>
          <p className="text-sm text-gray-500">Definí los parámetros específicos del módulo Maquinaria.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de maquinaria</CardTitle>
          <CardDescription>
            Configurá las categorías de máquinas disponibles en tu operación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás crear y editar tipos de maquinaria desde acá.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intervalos de service</CardTitle>
          <CardDescription>
            Definí los intervalos predeterminados de mantenimiento (por horas o fecha).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás definir intervalos de service por tipo de maquinaria.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
