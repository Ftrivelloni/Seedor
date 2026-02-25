import { requireRole } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';

export default async function ConfiguracionEmpaquePage() {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
          <Package className="h-5 w-5 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Empaque</h1>
          <p className="text-sm text-gray-500">Definí los parámetros específicos del módulo Empaque.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clasificación de frutas</CardTitle>
          <CardDescription>
            Configurá colores, calibres y categorías de clasificación para preselección.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás personalizar las categorías de clasificación desde acá.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cámaras</CardTitle>
          <CardDescription>
            Configurá las cámaras de frío y etileno disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Las cámaras se administran desde el módulo Empaque. Próximamente podrás configurar parámetros adicionales acá.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formato de códigos</CardTitle>
          <CardDescription>
            Configurá los prefijos y formatos para bines, cajas, pallets y despachos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás personalizar los prefijos de códigos secuenciales.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
