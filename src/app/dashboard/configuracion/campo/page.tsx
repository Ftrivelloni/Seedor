import { requireRole } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

export default async function ConfiguracionCampoPage() {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
          <MapPin className="h-5 w-5 text-green-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Campo</h1>
          <p className="text-sm text-gray-500">Definí los parámetros específicos del módulo Campo.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de tarea</CardTitle>
          <CardDescription>
            Administrá los tipos de tarea disponibles para asignar a lotes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Los tipos de tarea se configuran directamente desde el módulo Campo. Próximamente podrás gestionarlos desde acá.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de cultivo</CardTitle>
          <CardDescription>
            Configurá los cultivos disponibles para asignar a los lotes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Los tipos de cultivo se configuran directamente desde el módulo Campo. Próximamente podrás gestionarlos desde acá.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
