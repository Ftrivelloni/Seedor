'use client';

import { useState, useEffect, DragEvent } from 'react';
import Link from 'next/link';
import {
    TrendingUp,
    AlertTriangle,
    Package,
    CalendarClock,
    Settings2,
    Tractor,
    Warehouse,
    DollarSign,
    Leaf,
    BoxesIcon,
    BarChart3,
    LayoutGrid,
    GripVertical,
    X,
    ChevronDown,
    ChevronUp,
    Plus,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

// Widget configuration types
type WidgetId =
    | 'tareasActivas'
    | 'alertasStock'
    | 'ordenesActivas'
    | 'rendimientoPromedio'
    | 'rendimientoPorLote'
    | 'ventasMensuales'
    | 'tareasProximas'
    | 'alertasRecientes'
    | 'estadoMaquinaria'
    | 'stockInsumos'
    | 'clientesActivos'
    | 'costoPorHectarea';

type WidgetCategory = 'campo' | 'inventario' | 'maquinaria' | 'ventas' | 'empaque';
type WidgetSize = 'small' | 'medium' | 'large';
type SlotSize = 'small' | 'medium' | 'large';

interface WidgetConfig {
    id: WidgetId;
    name: string;
    description: string;
    category: WidgetCategory;
    enabled: boolean;
    preferredSize: WidgetSize;
}

interface LayoutSlot {
    id: string;
    size: SlotSize;
    gridClass: string;
}

interface LayoutTemplate {
    id: string;
    name: string;
    description: string;
    slots: LayoutSlot[];
    gridClass: string;
}

// Layout Templates
const layoutTemplates: LayoutTemplate[] = [
    {
        id: 'balanced',
        name: 'Balanceado',
        description: '4 cards pequeños arriba + 4 gráficos medianos',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-2', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-4', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-5', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-6', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-7', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-8', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
    {
        id: 'left-heavy',
        name: 'Panel Izquierdo',
        description: 'Gráfico grande a la izquierda + cards pequeños a la derecha',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'large', gridClass: 'col-span-2 row-span-4' },
            { id: 'slot-2', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-4', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-5', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-6', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
    {
        id: 'right-heavy',
        name: 'Panel Derecho',
        description: 'Cards pequeños a la izquierda + gráfico grande a la derecha',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-2', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-3', size: 'large', gridClass: 'col-span-2 row-span-4' },
            { id: 'slot-4', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-5', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-6', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
    {
        id: 'sidebar-left',
        name: 'Barra Lateral Izquierda',
        description: 'Columna de cards a la izquierda + gráficos grandes a la derecha',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'small', gridClass: 'col-span-1 row-span-1' },
            { id: 'slot-2', size: 'medium', gridClass: 'col-span-3 row-span-2' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1 row-span-1' },
            { id: 'slot-4', size: 'small', gridClass: 'col-span-1 row-span-1' },
            { id: 'slot-5', size: 'medium', gridClass: 'col-span-3 row-span-2' },
            { id: 'slot-6', size: 'small', gridClass: 'col-span-1 row-span-1' },
        ],
    },
    {
        id: 'sidebar-right',
        name: 'Barra Lateral Derecha',
        description: 'Gráficos grandes a la izquierda + columna de cards a la derecha',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'medium', gridClass: 'col-span-3 row-span-2' },
            { id: 'slot-2', size: 'small', gridClass: 'col-span-1 row-span-1' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1 row-span-1' },
            { id: 'slot-4', size: 'medium', gridClass: 'col-span-3 row-span-2' },
            { id: 'slot-5', size: 'small', gridClass: 'col-span-1 row-span-1' },
            { id: 'slot-6', size: 'small', gridClass: 'col-span-1 row-span-1' },
        ],
    },
    {
        id: 'mosaic',
        name: 'Mosaico',
        description: 'Mezcla alternada de tamaños grandes y pequeños',
        gridClass: 'grid-cols-6',
        slots: [
            { id: 'slot-1', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-2', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-4', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-5', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-6', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-7', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-8', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-9', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-10', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
    {
        id: 'focus',
        name: 'Enfocado',
        description: '1 gráfico grande central + 4 cards pequeños',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-2', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-4', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-5', size: 'large', gridClass: 'col-span-4 row-span-2' },
            { id: 'slot-6', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-7', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
    {
        id: 'zigzag',
        name: 'Zigzag',
        description: 'Alternancia horizontal de tamaños',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-2', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-4', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-5', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-6', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-7', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-8', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-9', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-10', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
    {
        id: 'center-stage',
        name: 'Centro Principal',
        description: 'Gráfico grande central con cards alrededor',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-2', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-3', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-4', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-5', size: 'small', gridClass: 'col-span-1' },
            { id: 'slot-6', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-7', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
    {
        id: 'analytics',
        name: 'Analítico',
        description: '4 gráficos medianos en cuadrícula',
        gridClass: 'grid-cols-4',
        slots: [
            { id: 'slot-1', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-2', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-3', size: 'medium', gridClass: 'col-span-2 row-span-2' },
            { id: 'slot-4', size: 'medium', gridClass: 'col-span-2 row-span-2' },
        ],
    },
];

const defaultWidgetConfig: WidgetConfig[] = [
    // Campo
    { id: 'tareasActivas', name: 'Tareas Activas', description: 'Cantidad de tareas pendientes y en progreso', category: 'campo', enabled: true, preferredSize: 'small' },
    { id: 'rendimientoPromedio', name: 'Rendimiento Promedio', description: 'Rendimiento promedio de todos los lotes', category: 'campo', enabled: true, preferredSize: 'small' },
    { id: 'rendimientoPorLote', name: 'Rendimiento por Lote', description: 'Gráfico de barras con rendimiento por lote', category: 'campo', enabled: true, preferredSize: 'medium' },
    { id: 'tareasProximas', name: 'Tareas Próximas', description: 'Lista de tareas pendientes', category: 'campo', enabled: true, preferredSize: 'medium' },
    { id: 'costoPorHectarea', name: 'Costo por Hectárea', description: 'Gráfico de costo por hectárea por lote', category: 'campo', enabled: true, preferredSize: 'medium' },

    // Inventario
    { id: 'alertasStock', name: 'Alertas de Stock', description: 'Cantidad de alertas de stock activas', category: 'inventario', enabled: true, preferredSize: 'small' },
    { id: 'alertasRecientes', name: 'Alertas Recientes', description: 'Lista de alertas recientes de inventario', category: 'inventario', enabled: true, preferredSize: 'medium' },
    { id: 'stockInsumos', name: 'Stock de Insumos', description: 'Estado del stock de insumos principales', category: 'inventario', enabled: true, preferredSize: 'medium' },

    // Maquinaria
    { id: 'estadoMaquinaria', name: 'Estado de Maquinaria', description: 'Resumen del estado de la maquinaria', category: 'maquinaria', enabled: true, preferredSize: 'medium' },

    // Ventas
    { id: 'ordenesActivas', name: 'Órdenes Activas', description: 'Cantidad de órdenes de venta activas', category: 'ventas', enabled: true, preferredSize: 'small' },
    { id: 'ventasMensuales', name: 'Ventas Mensuales', description: 'Gráfico de ventas de los últimos 6 meses', category: 'ventas', enabled: true, preferredSize: 'medium' },
    { id: 'clientesActivos', name: 'Clientes con Saldo', description: 'Clientes con saldo pendiente', category: 'ventas', enabled: true, preferredSize: 'medium' },
];

const categoryInfo: Record<WidgetCategory, { name: string; icon: React.ElementType; color: string }> = {
    campo: { name: 'Campo', icon: Leaf, color: 'text-green-600' },
    inventario: { name: 'Inventario', icon: Warehouse, color: 'text-blue-600' },
    maquinaria: { name: 'Maquinaria', icon: Tractor, color: 'text-orange-600' },
    ventas: { name: 'Ventas', icon: DollarSign, color: 'text-purple-600' },
    empaque: { name: 'Empaque', icon: BoxesIcon, color: 'text-amber-600' },
};

const STORAGE_KEY = 'seedor-dashboard-widgets';
const LAYOUT_STORAGE_KEY = 'seedor-dashboard-layout';
const PLACEMENT_STORAGE_KEY = 'seedor-dashboard-placement';

// Simple Card Component
function DashboardCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
            {children}
        </div>
    );
}

// Stat Card Component (like in the image)
function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    iconColor = 'text-green-600',
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: { value: string; positive: boolean };
    iconColor?: string;
}) {
    return (
        <DashboardCard className="p-5 h-full">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm text-gray-500">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-semibold text-gray-900">{value}</p>
                        {trend && (
                            <span className={`text-xs flex items-center gap-0.5 ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                                {trend.positive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {trend.value}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`p-2.5 rounded-lg bg-gray-50 ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </DashboardCard>
    );
}

// Badge Component
function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'destructive' | 'secondary' }) {
    const variants = {
        default: 'bg-amber-100 text-amber-700',
        destructive: 'bg-red-100 text-red-700',
        secondary: 'bg-gray-100 text-gray-700',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${variants[variant]}`}>
            {children}
        </span>
    );
}

// Toggle Switch Component
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    );
}

export default function Dashboard() {
    const { lotes, tareas, alertas, ordenes, maquinaria, insumos, clientes } = useAppContext();
    const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgetConfig);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('balanced');
    const [widgetPlacements, setWidgetPlacements] = useState<Record<string, WidgetId | null>>({});
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'templates' | 'widgets'>('templates');
    const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
    const [draggedFromSlot, setDraggedFromSlot] = useState<string | null>(null);
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

    // Load configs from localStorage
    useEffect(() => {
        const savedWidgets = localStorage.getItem(STORAGE_KEY);
        const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
        const savedPlacements = localStorage.getItem(PLACEMENT_STORAGE_KEY);

        if (savedWidgets) {
            try {
                const parsed = JSON.parse(savedWidgets);
                const merged = defaultWidgetConfig.map(defaultWidget => {
                    const savedWidget = parsed.find((w: WidgetConfig) => w.id === defaultWidget.id);
                    return savedWidget ? { ...defaultWidget, enabled: savedWidget.enabled } : defaultWidget;
                });
                setWidgets(merged);
            } catch {
                setWidgets(defaultWidgetConfig);
            }
        }

        if (savedLayout) {
            setSelectedTemplate(savedLayout);
        }

        if (savedPlacements) {
            try {
                setWidgetPlacements(JSON.parse(savedPlacements));
            } catch {
                setWidgetPlacements({});
            }
        }
    }, []);

    // Initialize placements when template changes
    useEffect(() => {
        const template = layoutTemplates.find(t => t.id === selectedTemplate);
        if (template) {
            const savedPlacements = localStorage.getItem(PLACEMENT_STORAGE_KEY);
            let existingPlacements: Record<string, WidgetId | null> = {};

            if (savedPlacements) {
                try {
                    existingPlacements = JSON.parse(savedPlacements);
                } catch {
                    existingPlacements = {};
                }
            }

            // Only auto-fill if no placements exist for this template
            const hasPlacementsForTemplate = template.slots.some(slot => existingPlacements[slot.id]);

            if (!hasPlacementsForTemplate) {
                const enabledWidgets = widgets.filter(w => w.enabled);
                const newPlacements: Record<string, WidgetId | null> = {};

                template.slots.forEach((slot, index) => {
                    const matchingWidgets = enabledWidgets.filter(w => {
                        if (slot.size === 'small') return w.preferredSize === 'small';
                        return w.preferredSize === 'medium' || w.preferredSize === 'large';
                    });
                    const availableWidget = matchingWidgets.find(w =>
                        !Object.values(newPlacements).includes(w.id)
                    );
                    newPlacements[slot.id] = availableWidget?.id || null;
                });

                setWidgetPlacements(prev => ({ ...prev, ...newPlacements }));
                localStorage.setItem(PLACEMENT_STORAGE_KEY, JSON.stringify({ ...existingPlacements, ...newPlacements }));
            } else {
                setWidgetPlacements(existingPlacements);
            }
        }
    }, [selectedTemplate, widgets]);

    // Save functions
    const saveWidgets = (newWidgets: WidgetConfig[]) => {
        setWidgets(newWidgets);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
    };

    const saveLayout = (templateId: string) => {
        setSelectedTemplate(templateId);
        localStorage.setItem(LAYOUT_STORAGE_KEY, templateId);
    };

    const savePlacements = (newPlacements: Record<string, WidgetId | null>) => {
        setWidgetPlacements(newPlacements);
        localStorage.setItem(PLACEMENT_STORAGE_KEY, JSON.stringify(newPlacements));
    };

    const toggleWidget = (widgetId: WidgetId) => {
        const newWidgets = widgets.map(w =>
            w.id === widgetId ? { ...w, enabled: !w.enabled } : w
        );
        saveWidgets(newWidgets);

        // Remove from placements if disabled
        const widget = widgets.find(w => w.id === widgetId);
        if (widget?.enabled) {
            const newPlacements = { ...widgetPlacements };
            Object.keys(newPlacements).forEach(slotId => {
                if (newPlacements[slotId] === widgetId) {
                    newPlacements[slotId] = null;
                }
            });
            savePlacements(newPlacements);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: DragEvent, widgetId: WidgetId, fromSlot?: string) => {
        setDraggedWidget(widgetId);
        setDraggedFromSlot(fromSlot || null);
        e.dataTransfer.effectAllowed = 'move';
        // Set a transparent drag image
        const dragImage = document.createElement('div');
        dragImage.style.opacity = '0';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (e: DragEvent, slotId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (hoveredSlot !== slotId) {
            setHoveredSlot(slotId);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        // Only clear if we're leaving the slot entirely
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
            setHoveredSlot(null);
        }
    };

    const handleDrop = (e: DragEvent, slotId: string) => {
        e.preventDefault();
        if (!draggedWidget) return;

        const newPlacements = { ...widgetPlacements };

        // If dragging from another slot, clear that slot
        if (draggedFromSlot) {
            newPlacements[draggedFromSlot] = widgetPlacements[slotId] || null; // Swap
        } else {
            // Clear widget from any existing slot
            Object.keys(newPlacements).forEach(key => {
                if (newPlacements[key] === draggedWidget) {
                    newPlacements[key] = null;
                }
            });
        }

        newPlacements[slotId] = draggedWidget;
        savePlacements(newPlacements);
        setDraggedWidget(null);
        setDraggedFromSlot(null);
        setHoveredSlot(null);
    };

    const handleDragEnd = () => {
        setDraggedWidget(null);
        setDraggedFromSlot(null);
        setHoveredSlot(null);
    };

    const removeWidgetFromSlot = (slotId: string) => {
        const newPlacements = { ...widgetPlacements, [slotId]: null };
        savePlacements(newPlacements);
    };

    // Data calculations
    const tareasActivas = tareas.filter((t) => t.estado !== 'completada').length;
    const alertasActivas = alertas.filter((a) => a.estado === 'activa').length;
    const ordenesActivas = ordenes.filter((o) => o.estado !== 'entregada').length;
    const rendimientoPromedio = Math.round(lotes.reduce((acc, l) => acc + l.rendimiento, 0) / lotes.length);

    const rendimientoPorLote = lotes.slice(0, 6).map((l) => ({
        nombre: l.nombre,
        rendimiento: l.rendimiento,
    }));

    const costoPorHectarea = lotes.slice(0, 6).map((l) => ({
        nombre: l.nombre,
        costo: l.costoHa,
    }));

    const ventasPorMes = [
        { mes: 'Ago', ventas: 45 },
        { mes: 'Sep', ventas: 52 },
        { mes: 'Oct', ventas: 61 },
        { mes: 'Nov', ventas: 58 },
        { mes: 'Dic', ventas: 70 },
        { mes: 'Ene', ventas: 68 },
    ];

    const tareasPendientes = tareas.filter((t) => t.estado === 'pendiente').slice(0, 5);
    const maquinariaEstado = [
        { name: 'OK', value: maquinaria.filter((m) => m.estado === 'ok').length, color: '#10b981' },
        { name: 'Service pronto', value: maquinaria.filter((m) => m.estado === 'service-pronto').length, color: '#f59e0b' },
        { name: 'Crítico', value: maquinaria.filter((m) => m.estado === 'critico').length, color: '#ef4444' },
    ].filter(item => item.value > 0);
    const insumosBajoStock = insumos.filter((i) => i.estado === 'bajo' || i.estado === 'critico').slice(0, 5);
    const clientesConSaldo = clientes.filter((c) => c.saldoPendiente > 0).slice(0, 5);

    // Get widget name for ghost preview
    const getWidgetName = (widgetId: WidgetId): string => {
        const widget = widgets.find(w => w.id === widgetId);
        return widget?.name || '';
    };

    // Get widget category icon
    const getWidgetCategoryInfo = (widgetId: WidgetId) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return null;
        return categoryInfo[widget.category];
    };

    // Render ghost preview for the dragged widget
    const renderGhostPreview = (widgetId: WidgetId, slotSize: SlotSize) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return null;

        const catInfo = categoryInfo[widget.category];
        const Icon = catInfo.icon;

        return (
            <div className="h-full w-full rounded-lg border-2 border-green-400 bg-green-50/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 animate-pulse">
                <div className={`p-3 rounded-full bg-white shadow-sm`}>
                    <Icon className={`h-6 w-6 ${catInfo.color}`} />
                </div>
                <span className="text-sm font-medium text-green-700 text-center">{widget.name}</span>
                <span className="text-xs text-green-600">Soltar para colocar</span>
            </div>
        );
    };

    // Widget rendering function
    const renderWidget = (widgetId: WidgetId, slotSize: SlotSize, slotId: string, isGhost: boolean = false) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget || !widget.enabled) return null;

        // If this is a ghost preview, render it differently
        if (isGhost) {
            return renderGhostPreview(widgetId, slotSize);
        }

        // Check if this widget is being dragged (show it dimmed)
        const isBeingDragged = draggedWidget === widgetId && draggedFromSlot === slotId;

        const chartHeight = slotSize === 'large' ? 350 : slotSize === 'medium' ? 280 : 150;
        const draggedStyles = isBeingDragged ? 'opacity-40 scale-95 transition-all duration-200' : 'transition-all duration-200';

        const dragHandle = (
            <div
                className="absolute top-3 right-9 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
                draggable
                onDragStart={(e) => handleDragStart(e, widgetId, slotId)}
                onDragEnd={handleDragEnd}
            >
                <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
        );

        const removeButton = (
            <button
                onClick={() => removeWidgetFromSlot(slotId)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 hover:bg-gray-100 rounded"
            >
                <X className="h-3 w-3 text-gray-400" />
            </button>
        );

        switch (widgetId) {
            case 'tareasActivas':
                return (
                    <div className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <StatCard
                            title="Tareas activas"
                            value={tareasActivas}
                            icon={CalendarClock}
                            iconColor="text-blue-600"
                            trend={{ value: '2.5%', positive: true }}
                        />
                    </div>
                );
            case 'alertasStock':
                return (
                    <div className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <StatCard
                            title="Alertas de stock"
                            value={alertasActivas}
                            icon={AlertTriangle}
                            iconColor="text-orange-600"
                            trend={{ value: '0.2%', positive: false }}
                        />
                    </div>
                );
            case 'ordenesActivas':
                return (
                    <div className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <StatCard
                            title="Órdenes activas"
                            value={ordenesActivas}
                            icon={Package}
                            iconColor="text-purple-600"
                            trend={{ value: '0.12%', positive: true }}
                        />
                    </div>
                );
            case 'rendimientoPromedio':
                return (
                    <div className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <StatCard
                            title="Rendimiento promedio"
                            value={`${rendimientoPromedio}%`}
                            icon={TrendingUp}
                            iconColor="text-green-600"
                            trend={{ value: '0.5%', positive: true }}
                        />
                    </div>
                );
            case 'rendimientoPorLote':
                return (
                    <DashboardCard className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-gray-900">Rendimiento por lote</h3>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                        Rendimiento
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="px-2 pb-4">
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart data={rendimientoPorLote} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="rendimiento" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardCard>
                );
            case 'ventasMensuales':
                return (
                    <DashboardCard className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-gray-900">Ventas últimos 6 meses</h3>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                                        Ventas (millones)
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="px-2 pb-4">
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart data={ventasPorMes} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="ventas" fill="#fb923c" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardCard>
                );
            case 'costoPorHectarea':
                return (
                    <DashboardCard className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-gray-900">Costo por Hectárea ($/ha)</h3>
                            </div>
                        </div>
                        <div className="px-2 pb-4">
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart data={costoPorHectarea} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="costo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardCard>
                );
            case 'estadoMaquinaria':
                return (
                    <DashboardCard className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-gray-900">Estado de Maquinaria</h3>
                            </div>
                        </div>
                        <div className="px-2 pb-4 flex items-center">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={chartHeight}>
                                    <PieChart>
                                        <Pie
                                            data={maquinariaEstado}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={slotSize === 'large' ? 70 : 50}
                                            outerRadius={slotSize === 'large' ? 110 : 80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {maquinariaEstado.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 pr-4">
                                {maquinariaEstado.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-sm text-gray-600">{item.name}</span>
                                        <span className="text-sm font-medium ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DashboardCard>
                );
            case 'tareasProximas':
                return (
                    <DashboardCard className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium text-gray-900">Tareas próximas</h3>
                                <Link href="/dashboard/campo/calendario" className="text-xs text-green-600 hover:text-green-700">
                                    Ver todas
                                </Link>
                            </div>
                        </div>
                        <div className="px-5 pb-5 overflow-auto max-h-[280px]">
                            <div className="space-y-2">
                                {tareasPendientes.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-4">No hay tareas pendientes</p>
                                ) : (
                                    tareasPendientes.map((tarea) => (
                                        <div
                                            key={tarea.id}
                                            className={`flex items-start justify-between rounded-lg p-3 ${tarea.prioridad === 'alta' ? 'bg-red-50' : tarea.prioridad === 'media' ? 'bg-amber-50' : 'bg-gray-50'}`}
                                        >
                                            <div className="space-y-0.5 flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">{tarea.descripcion}</p>
                                                <p className="text-xs text-gray-500">{tarea.lotes.length} lote(s)</p>
                                            </div>
                                            <Badge variant={tarea.prioridad === 'alta' ? 'destructive' : tarea.prioridad === 'media' ? 'default' : 'secondary'}>
                                                {tarea.prioridad}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </DashboardCard>
                );
            case 'alertasRecientes':
                return (
                    <DashboardCard className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium text-gray-900">Alertas recientes</h3>
                                <Link href="/dashboard/inventario/alertas" className="text-xs text-green-600 hover:text-green-700">
                                    Ver todas
                                </Link>
                            </div>
                        </div>
                        <div className="px-5 pb-5 overflow-auto max-h-[280px]">
                            <div className="space-y-2">
                                {alertas.slice(0, 5).map((alerta) => (
                                    <div key={alerta.id} className={`flex items-start gap-3 rounded-lg p-3 ${alerta.tipo === 'Sin stock' ? 'bg-red-50' : 'bg-amber-50'}`}>
                                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${alerta.tipo === 'Sin stock' ? 'bg-red-100' : 'bg-amber-100'}`}>
                                            <AlertTriangle className={`h-3.5 w-3.5 ${alerta.tipo === 'Sin stock' ? 'text-red-600' : 'text-amber-600'}`} />
                                        </div>
                                        <div className="flex-1 space-y-0.5 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm">{alerta.tipo}</p>
                                            <p className="text-xs text-gray-600 truncate">{alerta.insumo}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DashboardCard>
                );
            case 'stockInsumos':
                return (
                    <DashboardCard className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium text-gray-900">Insumos con Stock Bajo</h3>
                                <Link href="/dashboard/inventario" className="text-xs text-green-600 hover:text-green-700">
                                    Ver todos
                                </Link>
                            </div>
                        </div>
                        <div className="px-5 pb-5 overflow-auto max-h-[280px]">
                            <div className="space-y-2">
                                {insumosBajoStock.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-4">Stock suficiente</p>
                                ) : (
                                    insumosBajoStock.map((insumo) => (
                                        <div key={insumo.id} className={`flex items-center justify-between rounded-lg p-3 ${insumo.estado === 'critico' ? 'bg-red-50' : 'bg-amber-50'}`}>
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 text-sm truncate">{insumo.nombre}</p>
                                                <p className="text-xs text-gray-500">{insumo.categoria}</p>
                                            </div>
                                            <div className="text-right ml-3">
                                                <p className={`font-semibold text-sm ${insumo.estado === 'critico' ? 'text-red-600' : 'text-amber-600'}`}>
                                                    {insumo.stockTotal} {insumo.unidad}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </DashboardCard>
                );
            case 'clientesActivos':
                return (
                    <DashboardCard className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <div className="p-5 pb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium text-gray-900">Clientes con Saldo</h3>
                                <Link href="/dashboard/ventas" className="text-xs text-green-600 hover:text-green-700">
                                    Ver todos
                                </Link>
                            </div>
                        </div>
                        <div className="px-5 pb-5 overflow-auto max-h-[280px]">
                            <div className="space-y-2">
                                {clientesConSaldo.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-4">Sin saldos pendientes</p>
                                ) : (
                                    clientesConSaldo.map((cliente) => (
                                        <div key={cliente.id} className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 text-sm truncate">{cliente.nombre}</p>
                                                <p className="text-xs text-gray-500">{cliente.tipo}</p>
                                            </div>
                                            <p className="font-semibold text-red-600 text-sm ml-3">
                                                ${cliente.saldoPendiente.toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </DashboardCard>
                );
            default:
                return null;
        }
    };

    const currentTemplate = layoutTemplates.find(t => t.id === selectedTemplate) || layoutTemplates[0];
    const enabledWidgets = widgets.filter(w => w.enabled);
    const placedWidgetIds = Object.values(widgetPlacements).filter(Boolean) as WidgetId[];
    const unplacedWidgets = enabledWidgets.filter(w => !placedWidgetIds.includes(w.id));

    // Group widgets by category for the customization panel
    const widgetsByCategory = (category: WidgetCategory) => widgets.filter(w => w.category === category);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Resumen general de tu operación agrícola
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Settings2 className="h-4 w-4" />
                        Personalizar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                        <Plus className="h-4 w-4" />
                        Agregar datos
                    </button>
                </div>
            </div>

            {/* Customization Panel (Sheet) */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
                    <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="h-5 w-5 text-gray-700" />
                                    <h2 className="text-lg font-semibold text-gray-900">Personalizar Dashboard</h2>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Elige una plantilla y arrastra los widgets a los espacios disponibles.
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab('templates')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid className="h-4 w-4 inline mr-2" />
                                    Plantillas
                                </button>
                                <button
                                    onClick={() => setActiveTab('widgets')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'widgets' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    <BarChart3 className="h-4 w-4 inline mr-2" />
                                    Widgets
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'templates' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">Selecciona cómo organizar tu dashboard:</p>
                                    <div className="grid gap-3">
                                        {layoutTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                onClick={() => saveLayout(template.id)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTemplate === template.id
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                                    </div>
                                                    {selectedTemplate === template.id && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-full">Activo</span>
                                                    )}
                                                </div>
                                                <div className={`mt-3 grid ${template.gridClass} gap-1 h-16`}>
                                                    {template.slots.slice(0, 8).map((slot) => (
                                                        <div
                                                            key={slot.id}
                                                            className={`${slot.gridClass} rounded ${selectedTemplate === template.id ? 'bg-green-200' : 'bg-gray-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'widgets' && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600">Activa o desactiva widgets:</p>
                                    {(Object.keys(categoryInfo) as WidgetCategory[]).map((category) => {
                                        const info = categoryInfo[category];
                                        const categoryWidgets = widgetsByCategory(category);
                                        if (categoryWidgets.length === 0) return null;

                                        return (
                                            <div key={category}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <info.icon className={`h-4 w-4 ${info.color}`} />
                                                    <h3 className="font-medium text-sm text-gray-900">{info.name}</h3>
                                                    <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {categoryWidgets.filter(w => w.enabled).length}/{categoryWidgets.length}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {categoryWidgets.map((widget) => (
                                                        <div
                                                            key={widget.id}
                                                            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <label htmlFor={widget.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                                                                {widget.name}
                                                            </label>
                                                            <Toggle
                                                                checked={widget.enabled}
                                                                onChange={() => toggleWidget(widget.id)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-b border-gray-200 mt-4" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Unplaced widgets tray */}
            {unplacedWidgets.length > 0 && (
                <DashboardCard className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Widgets disponibles</span>
                        <span className="text-xs text-gray-500">(arrastra al dashboard)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {unplacedWidgets.map((widget) => {
                            const catInfo = categoryInfo[widget.category];
                            const isDragging = draggedWidget === widget.id;
                            return (
                                <div
                                    key={widget.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, widget.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-all border border-gray-200 ${isDragging ? 'opacity-40 scale-95' : ''}`}
                                >
                                    <catInfo.icon className={`h-4 w-4 ${catInfo.color}`} />
                                    <span className="text-sm font-medium text-gray-700">{widget.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </DashboardCard>
            )}

            {/* Dashboard grid */}
            <div className={`grid ${currentTemplate.gridClass} gap-5 auto-rows-[minmax(120px,auto)]`}>
                {currentTemplate.slots.map((slot) => {
                    const widgetId = widgetPlacements[slot.id];
                    const hasWidget = widgetId && widgets.find(w => w.id === widgetId)?.enabled;
                    const isHovered = hoveredSlot === slot.id && draggedWidget;
                    const showGhostPreview = isHovered && draggedWidget && (!hasWidget || widgetId !== draggedWidget);

                    return (
                        <div
                            key={slot.id}
                            className={`${slot.gridClass} min-h-[120px] transition-transform duration-200 ${isHovered ? 'scale-[1.02]' : ''}`}
                            onDragOver={(e) => handleDragOver(e, slot.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, slot.id)}
                        >
                            {showGhostPreview ? (
                                renderGhostPreview(draggedWidget, slot.size)
                            ) : hasWidget ? (
                                renderWidget(widgetId, slot.size, slot.id)
                            ) : (
                                <div
                                    className={`h-full border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-200 ${draggedWidget
                                        ? 'border-green-400 bg-green-50/50'
                                        : 'border-gray-200 bg-gray-50/50'
                                        }`}
                                >
                                    <div className="text-center p-4">
                                        <LayoutGrid className={`h-6 w-6 mx-auto mb-2 transition-colors ${draggedWidget ? 'text-green-400' : 'text-gray-300'}`} />
                                        <p className={`text-xs transition-colors ${draggedWidget ? 'text-green-600' : 'text-gray-400'}`}>
                                            {draggedWidget ? 'Soltar aquí' : 'Arrastra un widget'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {!widgets.some(w => w.enabled) && (
                <DashboardCard className="p-12">
                    <div className="text-center">
                        <Settings2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay widgets activos</h3>
                        <p className="mt-2 text-sm text-gray-500">Personaliza tu dashboard activando los widgets que quieres ver.</p>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <Settings2 className="h-4 w-4" />
                            Personalizar Dashboard
                        </button>
                    </div>
                </DashboardCard>
            )}
        </div>
    );
}
