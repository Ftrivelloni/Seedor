import { requireRole } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import Link from 'next/link';
import { ArrowLeft, Warehouse } from 'lucide-react';

export default async function ConfiguracionInventarioPage() {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Warehouse className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Inventario</h1>
          <p className="text-sm text-gray-500">Definí los parámetros específicos del módulo Inventario.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Niveles de alerta de stock</CardTitle>
          <CardDescription>
            Configurá los umbrales para las alertas de stock bajo y crítico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás definir niveles de alerta personalizados por ítem.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías de ítems</CardTitle>
          <CardDescription>
            Administrá las categorías disponibles para los ítems de inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás crear y editar categorías desde acá.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
