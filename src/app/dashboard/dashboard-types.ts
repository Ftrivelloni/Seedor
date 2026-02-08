/* ── Dashboard types & widget registry ── */

export type TemplateKey =
  | 'balanced'
  | 'panel-left'
  | 'panel-right'
  | 'sidebar-left'
  | 'sidebar-right';

export interface TemplateOption {
  key: TemplateKey;
  label: string;
  description: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { key: 'balanced', label: 'Balanceado', description: '4 cards pequeños arriba + 4 gráficos medianos' },
  { key: 'panel-left', label: 'Panel Izquierdo', description: 'Gráfico grande a la izquierda + cards pequeños a la derecha' },
  { key: 'panel-right', label: 'Panel Derecho', description: 'Cards pequeños a la izquierda + gráfico grande a la derecha' },
  { key: 'sidebar-left', label: 'Barra Lateral Izquierda', description: 'Columna de cards a la izquierda + gráficos grandes a la derecha' },
  { key: 'sidebar-right', label: 'Barra Lateral Derecha', description: 'Gráficos grandes a la izquierda + columna de cards a la derecha' },
];

export type ModuleKey = 'campo' | 'inventario' | 'maquinaria' | 'ventas';

export type WidgetSize = 'kpi' | 'medium' | 'large';

export interface WidgetDefinition {
  id: string;
  label: string;
  module: ModuleKey;
  size: WidgetSize;
  icon: string; // lucide icon name
  adminOnly?: boolean;
}

export const MODULE_LABELS: Record<ModuleKey, string> = {
  campo: 'Campo',
  inventario: 'Inventario',
  maquinaria: 'Maquinaria',
  ventas: 'Ventas',
};

export const MODULE_ICONS: Record<ModuleKey, string> = {
  campo: 'Sprout',
  inventario: 'Package',
  maquinaria: 'Truck',
  ventas: 'DollarSign',
};

export const WIDGET_CATALOG: WidgetDefinition[] = [
  // Campo
  { id: 'active_tasks', label: 'Tareas Activas', module: 'campo', size: 'kpi', icon: 'ClipboardList' },
  { id: 'avg_yield', label: 'Rendimiento Promedio', module: 'campo', size: 'kpi', icon: 'TrendingUp' },
  { id: 'yield_per_lot', label: 'Rendimiento por Lote', module: 'campo', size: 'medium', icon: 'BarChart3' },
  { id: 'upcoming_tasks', label: 'Tareas Próximas', module: 'campo', size: 'medium', icon: 'CalendarClock' },
  { id: 'cost_per_hectare', label: 'Costo por Hectárea', module: 'campo', size: 'medium', icon: 'Calculator' },

  // Inventario
  { id: 'stock_alerts_kpi', label: 'Alertas de Stock', module: 'inventario', size: 'kpi', icon: 'AlertTriangle' },
  { id: 'recent_alerts', label: 'Alertas Recientes', module: 'inventario', size: 'medium', icon: 'Bell' },
  { id: 'stock_overview', label: 'Stock de Insumos', module: 'inventario', size: 'medium', icon: 'Package' },

  // Maquinaria
  { id: 'machinery_status', label: 'Estado de Maquinaria', module: 'maquinaria', size: 'medium', icon: 'Truck' },

  // Ventas
  { id: 'active_orders', label: 'Órdenes Activas', module: 'ventas', size: 'kpi', icon: 'ShoppingCart', adminOnly: true },
  { id: 'monthly_sales', label: 'Ventas Mensuales', module: 'ventas', size: 'medium', icon: 'DollarSign', adminOnly: true },
  { id: 'clients_balance', label: 'Clientes con Saldo', module: 'ventas', size: 'medium', icon: 'Users', adminOnly: true },
];

export const DEFAULT_WIDGETS = [
  'active_tasks',
  'avg_yield',
  'stock_alerts_kpi',
  'yield_per_lot',
  'upcoming_tasks',
  'cost_per_hectare',
  'recent_alerts',
];

/** Data passed from server to client for each widget */
export interface DashboardData {
  // KPI
  activeTasks: number;
  activeTasksTrend: number;
  avgYield: number;
  avgYieldTrend: number;
  stockAlertCount: number;
  stockAlertTrend: number;
  activeOrders: number;
  activeOrdersTrend: number;
  // Lists
  upcomingTasks: { id: string; description: string; taskType: string; lots: string; priority: string }[];
  recentAlerts: { id: string; level: string; itemName: string; warehouseName: string }[];
  // Charts
  yieldPerLot: { lotName: string; kilos: number }[];
  costPerHectare: { lotName: string; cost: number; hectares: number }[];
  // Inventory
  stockOverview: { itemName: string; totalQty: number; unit: string }[];
  // Machinery (placeholder — no machinery model yet so we use mock-ready structure)
  machineryStatus: { ok: number; maintenance: number; broken: number };
  // Sales
  monthlySales: { month: string; amount: number }[];
  clientsWithBalance: number;
}
