import { requireRole } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export default async function ConfiguracionVentasPage() {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
          <ShoppingCart className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Ventas</h1>
          <p className="text-sm text-gray-500">Definí los parámetros específicos del módulo Ventas.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monedas y tasas de cambio</CardTitle>
          <CardDescription>
            Configurá las monedas aceptadas y la tasa de cambio predeterminada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Próximamente podrás configurar monedas y tasas de conversión desde acá.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Administrá la base de datos de clientes para ventas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Los clientes se gestionan desde el módulo Ventas. Próximamente podrás importar y exportar desde acá.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
