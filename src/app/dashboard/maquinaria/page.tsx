'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/dashboard/ui/button';
import { Card, CardContent } from '@/components/dashboard/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table';
import { Badge } from '@/components/dashboard/ui/badge';
import { mockMaquinaria } from '@/data/seedorData';

export default function MaquinariaLista() {
  const maquinaria = mockMaquinaria;

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'service pronto':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'crítico':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getRowClassName = (estado: string) => {
    switch (estado) {
      case 'service pronto':
        return 'bg-amber-50 hover:bg-amber-100';
      case 'crítico':
        return 'bg-red-50 hover:bg-red-100';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Maquinaria</h1>
          <p className="mt-1 text-sm text-gray-600">Gestión de equipos y mantenimientos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar máquina
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>Máquina</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contahoras</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Próximo service</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maquinaria.map((maq) => (
                <TableRow key={maq.id} className={getRowClassName(maq.estado)}>
                  <TableCell>
                    {maq.imagen && (
                      <Image
                        src={maq.imagen}
                        alt={maq.tipo}
                        width={48}
                        height={48}
                        className="rounded-lg object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{maq.nombre}</TableCell>
                  <TableCell>{maq.tipo}</TableCell>
                  <TableCell>{maq.contahoras} hs</TableCell>
                  <TableCell>{maq.ubicacion}</TableCell>
                  <TableCell>{maq.proximoService} hs</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEstadoIcon(maq.estado)}
                      <Badge
                        variant={
                          maq.estado === 'ok'
                            ? 'secondary'
                            : maq.estado === 'service pronto'
                              ? 'default'
                              : 'destructive'
                        }
                      >
                        {maq.estado}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/maquinaria/${maq.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver detalle
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
