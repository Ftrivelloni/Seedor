'use client';

import { useState } from 'react';
import {
  Package,
  Warehouse as WarehouseIcon,
  ArrowLeftRight,
  AlertTriangle,
  ListChecks,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { CreateWarehouseModal } from './CreateWarehouseModal';
import { CreateItemModal } from './CreateItemModal';
import { RegisterMovementModal } from './RegisterMovementModal';
import { CreateExtraordinaryModal } from './CreateExtraordinaryModal';
import { updateStockThresholdAction, markExtraordinaryDeliveredAction } from './actions';
import type {
  SerializedWarehouse,
  SerializedItem,
  SerializedMovement,
  SerializedExtraordinaryRequest,
  SerializedAlert,
} from './types';

/* ── helpers ── */

const movementTypeLabels: Record<string, { label: string; color: string }> = {
  INCOME: { label: 'Ingreso', color: 'bg-green-100 text-green-700' },
  TRANSFER: { label: 'Traslado', color: 'bg-blue-100 text-blue-700' },
  CONSUMPTION: { label: 'Consumo', color: 'bg-orange-100 text-orange-700' },
  ADJUSTMENT: { label: 'Ajuste', color: 'bg-gray-100 text-gray-700' },
};

const alertBadge: Record<string, { label: string; className: string }> = {
  BAJO: { label: 'Bajo', className: 'bg-amber-100 text-amber-700 border-0' },
  CRITICO: { label: 'Crítico', className: 'bg-red-100 text-red-700 border-0' },
  SIN_STOCK: { label: 'Sin stock', className: 'bg-red-200 text-red-800 border-0' },
  OK: { label: 'OK', className: 'bg-green-100 text-green-700 border-0' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

/* ── Props ── */

interface InventoryPageClientProps {
  warehouses: SerializedWarehouse[];
  items: SerializedItem[];
  movements: SerializedMovement[];
  extraordinaryRequests: SerializedExtraordinaryRequest[];
  alerts: SerializedAlert[];
}

/* ── Component ── */

export function InventoryPageClient({
  warehouses,
  items,
  movements,
  extraordinaryRequests,
  alerts,
}: InventoryPageClientProps) {
  const [search, setSearch] = useState('');

  const lowStockCount = alerts.filter((a) => a.level === 'BAJO').length;
  const criticalCount = alerts.filter((a) => a.level === 'CRITICO').length;
  const outOfStockCount = alerts.filter((a) => a.level === 'SIN_STOCK').length;
  const pendingExtraordinary = extraordinaryRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-600">
            Depósitos, insumos, movimientos, alertas de stock y pedidos extraordinarios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RegisterMovementModal warehouses={warehouses} items={items} />
          <CreateItemModal />
          <CreateWarehouseModal />
        </div>
      </header>

      {/* ── KPI cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <div className="flex items-center gap-2">
            <WarehouseIcon className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Depósitos</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{warehouses.length}</p>
        </article>
        <article className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Insumos</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{items.length}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Alertas de stock</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{alerts.length}</p>
          <p className="text-xs opacity-80">
            Bajo: {lowStockCount} · Crítico: {criticalCount} · Sin stock: {outOfStockCount}
          </p>
        </article>
        <article className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-purple-800">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Movimientos recientes</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{movements.length}</p>
        </article>
      </section>

      {/* ── Tabs ── */}
      <Tabs defaultValue="depositos" className="w-full">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="depositos" className="gap-1.5">
              <WarehouseIcon className="h-4 w-4" />
              Depósitos
            </TabsTrigger>
            <TabsTrigger value="insumos" className="gap-1.5">
              <Package className="h-4 w-4" />
              Insumos
            </TabsTrigger>
            <TabsTrigger value="movimientos" className="gap-1.5">
              <ArrowLeftRight className="h-4 w-4" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="alertas" className="gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Alertas
              {alerts.length > 0 && (
                <Badge className="ml-1 bg-red-100 text-red-700 border-0 text-[10px] px-1.5">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="extraordinarios" className="gap-1.5">
              <ListChecks className="h-4 w-4" />
              Extraordinarios
              {pendingExtraordinary > 0 && (
                <Badge className="ml-1 bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5">
                  {pendingExtraordinary}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* ── TAB: Depósitos ── */}
        <TabsContent value="depositos" className="mt-4 space-y-4">
          {warehouses.length === 0 ? (
            <EmptyCard
              title="Sin depósitos"
              description="Creá tu primer depósito para empezar a registrar stock."
            />
          ) : (
            warehouses
              .filter((w) => matchSearch(w.name, search) || matchSearch(w.description ?? '', search))
              .map((warehouse) => (
                <WarehouseCard key={warehouse.id} warehouse={warehouse} search={search} />
              ))
          )}
        </TabsContent>

        {/* ── TAB: Insumos ── */}
        <TabsContent value="insumos" className="mt-4">
          {items.length === 0 ? (
            <EmptyCard
              title="Sin insumos"
              description="Registrá un insumo para empezar a controlar stock."
            />
          ) : (
            <ItemsTable items={items} search={search} />
          )}
        </TabsContent>

        {/* ── TAB: Movimientos ── */}
        <TabsContent value="movimientos" className="mt-4">
          {movements.length === 0 ? (
            <EmptyCard
              title="Sin movimientos"
              description="Los movimientos aparecerán acá cuando registres ingresos, traslados o consumos."
            />
          ) : (
            <MovementsTable movements={movements} search={search} />
          )}
        </TabsContent>

        {/* ── TAB: Alertas ── */}
        <TabsContent value="alertas" className="mt-4">
          {alerts.length === 0 ? (
            <EmptyCard
              title="Sin alertas"
              description="Todos los insumos están por encima de los umbrales configurados."
            />
          ) : (
            <AlertsTable alerts={alerts} search={search} />
          )}
        </TabsContent>

        {/* ── TAB: Extraordinarios ── */}
        <TabsContent value="extraordinarios" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Pedidos puntuales fuera del stock habitual (repuestos, herramientas, etc.).
            </p>
            <CreateExtraordinaryModal />
          </div>
          {extraordinaryRequests.length === 0 ? (
            <EmptyCard
              title="Sin pedidos extraordinarios"
              description="Los pedidos extraordinarios se registran acá para centralizar necesidades puntuales."
            />
          ) : (
            <ExtraordinaryTable requests={extraordinaryRequests} search={search} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Sub-components ── */

function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12">
      <Package className="h-10 w-10 text-gray-300" />
      <h3 className="mt-4 text-base font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function matchSearch(text: string, search: string) {
  if (!search) return true;
  return text.toLowerCase().includes(search.toLowerCase());
}

/* ── Warehouse card with stock table ── */

function WarehouseCard({ warehouse, search }: { warehouse: SerializedWarehouse; search: string }) {
  const [expanded, setExpanded] = useState(true);

  const filteredStocks = warehouse.stocks.filter(
    (s) => matchSearch(s.itemName, search) || matchSearch(s.itemCode, search)
  );

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
      >
        <div>
          <h3 className="text-base font-semibold text-gray-900">{warehouse.name}</h3>
          <p className="text-xs text-gray-500">
            {warehouse.description || 'Sin descripción'} · {warehouse.stocks.length} insumo(s)
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-200">
          {filteredStocks.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-gray-500">
              No hay insumos que coincidan con la búsqueda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Insumo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Umbral bajo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Umbral crítico
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredStocks.map((stock) => (
                    <StockRow key={stock.id} stock={stock} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function StockRow({ stock }: { stock: SerializedWarehouse['stocks'][number] }) {
  const [editing, setEditing] = useState(false);
  const [lowVal, setLowVal] = useState(String(stock.lowThreshold));
  const [critVal, setCritVal] = useState(String(stock.criticalThreshold));
  const badge = alertBadge[stock.alertLevel] ?? alertBadge.OK;

  async function handleSave() {
    const fd = new FormData();
    fd.set('stockId', stock.id);
    fd.set('lowThreshold', lowVal);
    fd.set('criticalThreshold', critVal);
    await updateStockThresholdAction(fd);
    setEditing(false);
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-mono text-gray-600">{stock.itemCode}</td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {stock.itemName}
        <span className="ml-1 text-xs text-gray-400">({stock.itemUnit})</span>
      </td>
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
        {formatNumber(stock.quantity)} {stock.itemUnit}
      </td>
      <td className="px-4 py-3 text-center">
        <Badge className={badge.className}>{badge.label}</Badge>
      </td>
      {editing ? (
        <>
          <td className="px-4 py-3 text-right">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={lowVal}
              onChange={(e) => setLowVal(e.target.value)}
              className="ml-auto w-24 text-right"
            />
          </td>
          <td className="px-4 py-3 text-right">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={critVal}
              onChange={(e) => setCritVal(e.target.value)}
              className="ml-auto w-24 text-right"
            />
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-right text-sm text-gray-600">
            {formatNumber(stock.lowThreshold)}
          </td>
          <td className="px-4 py-3 text-right text-sm text-gray-600">
            {formatNumber(stock.criticalThreshold)}
          </td>
          <td className="px-4 py-3 text-right">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Editar umbrales
            </Button>
          </td>
        </>
      )}
    </tr>
  );
}

/* ── Items table ── */

function ItemsTable({ items, search }: { items: SerializedItem[]; search: string }) {
  const filtered = items.filter(
    (i) =>
      matchSearch(i.name, search) ||
      matchSearch(i.code, search) ||
      matchSearch(i.description, search)
  );

  if (filtered.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No se encontraron insumos que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Unidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Stock por depósito
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((item) => {
              const totalStock = item.stocks.reduce((acc, s) => acc + s.quantity, 0);
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{item.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.stocks.length === 0 ? (
                      <span className="text-gray-400">Sin depósitos</span>
                    ) : (
                      <div className="space-y-0.5">
                        {item.stocks.map((s) => (
                          <div key={s.warehouseId} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 min-w-[80px]">{s.warehouseName}:</span>
                            <span className="font-medium text-gray-900">
                              {formatNumber(s.quantity)} {item.unit}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-0.5 text-xs border-t border-gray-100">
                          <span className="text-gray-500 min-w-[80px] font-medium">Total:</span>
                          <span className="font-semibold text-gray-900">
                            {formatNumber(totalStock)} {item.unit}
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── Movements table ── */

function MovementsTable({
  movements,
  search,
}: {
  movements: SerializedMovement[];
  search: string;
}) {
  const filtered = movements.filter(
    (m) =>
      matchSearch(m.itemName, search) ||
      matchSearch(m.itemCode, search) ||
      matchSearch(m.notes ?? '', search) ||
      matchSearch(m.sourceWarehouseName ?? '', search) ||
      matchSearch(m.destinationWarehouseName ?? '', search)
  );

  if (filtered.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No se encontraron movimientos que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Insumo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cantidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Origen → Destino
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Registrado por
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Notas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((m) => {
              const typeInfo = movementTypeLabels[m.type] ?? {
                label: m.type,
                color: 'bg-gray-100 text-gray-700',
              };
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${typeInfo.color} border-0`}>{typeInfo.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-mono text-gray-500 mr-1">{m.itemCode}</span>
                    <span className="text-gray-900">{m.itemName}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatNumber(m.quantity)} {m.itemUnit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.sourceWarehouseName || '—'} → {m.destinationWarehouseName || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.createdByName || 'Sistema'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {m.notes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── Alerts table ── */

function AlertsTable({ alerts, search }: { alerts: SerializedAlert[]; search: string }) {
  const filtered = alerts.filter(
    (a) =>
      matchSearch(a.itemName, search) ||
      matchSearch(a.itemCode, search) ||
      matchSearch(a.warehouseName, search)
  );

  if (filtered.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No se encontraron alertas que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nivel
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Depósito
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Insumo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Stock actual
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Umbral bajo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Umbral crítico
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((a) => {
              const badge = alertBadge[a.level] ?? alertBadge.OK;
              return (
                <tr key={a.stockId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{a.warehouseName}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-mono text-gray-500 mr-1">{a.itemCode}</span>
                    <span className="text-gray-900">{a.itemName}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatNumber(a.quantity)} {a.itemUnit}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {formatNumber(a.lowThreshold)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {formatNumber(a.criticalThreshold)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── Extraordinary items table ── */

function ExtraordinaryTable({
  requests,
  search,
}: {
  requests: SerializedExtraordinaryRequest[];
  search: string;
}) {
  const filtered = requests.filter(
    (r) =>
      matchSearch(r.name, search) ||
      matchSearch(r.description, search) ||
      matchSearch(r.requestedByName, search)
  );

  if (filtered.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No se encontraron pedidos que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ítem
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Solicitado por
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha solicitud
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((r) => (
              <ExtraordinaryRow key={r.id} request={r} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExtraordinaryRow({ request }: { request: SerializedExtraordinaryRequest }) {
  const isPending = request.status === 'PENDING';

  async function handleDeliver() {
    const fd = new FormData();
    fd.set('requestId', request.id);
    await markExtraordinaryDeliveredAction(fd);
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{request.description}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{request.requestedByName}</td>
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatDate(request.requestedAt)}
      </td>
      <td className="px-4 py-3 text-center">
        {isPending ? (
          <Badge className="bg-amber-100 text-amber-700 border-0">Pendiente</Badge>
        ) : (
          <Badge className="bg-green-100 text-green-700 border-0">Entregado</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {isPending ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDeliver}>
            <Check className="h-3.5 w-3.5" />
            Marcar entregado
          </Button>
        ) : (
          <span className="text-xs text-gray-500">
            {request.deliveredAt ? formatDate(request.deliveredAt) : '—'}
          </span>
        )}
      </td>
    </tr>
  );
}
