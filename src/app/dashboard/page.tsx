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
} from 'lucide-react';
import { StateCard } from '@/components/dashboard/StateCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { Switch } from '@/components/dashboard/ui/switch';
import { Label } from '@/components/dashboard/ui/label';
import { Separator } from '@/components/dashboard/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/dashboard/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
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

export default function Dashboard() {
    const { lotes, tareas, alertas, ordenes, maquinaria, insumos, clientes } = useAppContext();
    const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgetConfig);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('balanced');
    const [widgetPlacements, setWidgetPlacements] = useState<Record<string, WidgetId | null>>({});
    const [isOpen, setIsOpen] = useState(false);
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
                className="absolute top-2 right-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 hover:bg-gray-100 rounded"
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
                        <StateCard
                            title="Tareas activas"
                            value={tareasActivas}
                            icon={CalendarClock}
                            iconColor="text-blue-600"
                            trend={{ value: '+12% vs mes anterior', positive: true }}
                        />
                    </div>
                );
            case 'alertasStock':
                return (
                    <div className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <StateCard
                            title="Alertas de stock"
                            value={alertasActivas}
                            icon={AlertTriangle}
                            iconColor="text-orange-600"
                        />
                    </div>
                );
            case 'ordenesActivas':
                return (
                    <div className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <StateCard
                            title="Órdenes activas"
                            value={ordenesActivas}
                            icon={Package}
                            iconColor="text-purple-600"
                        />
                    </div>
                );
            case 'rendimientoPromedio':
                return (
                    <div className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <StateCard
                            title="Rendimiento promedio"
                            value={`${rendimientoPromedio}%`}
                            icon={TrendingUp}
                            iconColor="text-green-600"
                            trend={{ value: '+5% vs campaña anterior', positive: true }}
                        />
                    </div>
                );
            case 'rendimientoPorLote':
                return (
                    <Card className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Rendimiento por lote</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart data={rendimientoPorLote}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="rendimiento" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );
            case 'ventasMensuales':
                return (
                    <Card className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Ventas últimos 6 meses (millones)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <LineChart data={ventasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );
            case 'costoPorHectarea':
                return (
                    <Card className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Costo por Hectárea ($/ha)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart data={costoPorHectarea}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="costo" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );
            case 'estadoMaquinaria':
                return (
                    <Card className={`relative group h-full ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Estado de Maquinaria</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {maquinariaEstado.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );
            case 'tareasProximas':
                return (
                    <Card className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Tareas próximas</CardTitle>
                                <Link href="/dashboard/campo/calendario" className="text-xs text-green-600 hover:underline">
                                    Ver todas
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-auto max-h-[300px]">
                            <div className="space-y-3">
                                {tareasPendientes.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-4">No hay tareas pendientes</p>
                                ) : (
                                    tareasPendientes.map((tarea) => (
                                        <div
                                            key={tarea.id}
                                            className={`flex items-start justify-between border-b pb-3 last:border-0 last:pb-0 rounded-lg p-2 -mx-2 ${tarea.prioridad === 'alta' ? 'bg-red-50' : tarea.prioridad === 'media' ? 'bg-amber-50' : ''}`}
                                        >
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">{tarea.descripcion}</p>
                                                <p className="text-xs text-gray-500">{tarea.lotes.length} lote(s)</p>
                                            </div>
                                            <Badge variant={tarea.prioridad === 'alta' ? 'destructive' : tarea.prioridad === 'media' ? 'default' : 'secondary'} className="ml-2 text-xs">
                                                {tarea.prioridad}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'alertasRecientes':
                return (
                    <Card className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Alertas recientes</CardTitle>
                                <Link href="/dashboard/inventario/alertas" className="text-xs text-green-600 hover:underline">
                                    Ver todas
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-auto max-h-[300px]">
                            <div className="space-y-3">
                                {alertas.slice(0, 5).map((alerta) => (
                                    <div key={alerta.id} className={`flex items-start gap-2 border-b pb-3 last:border-0 last:pb-0 rounded-lg p-2 -mx-2 ${alerta.tipo === 'Sin stock' ? 'bg-red-50' : 'bg-amber-50'}`}>
                                        <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${alerta.tipo === 'Sin stock' ? 'bg-red-100' : 'bg-amber-100'}`}>
                                            <AlertTriangle className={`h-3 w-3 ${alerta.tipo === 'Sin stock' ? 'text-red-600' : 'text-amber-600'}`} />
                                        </div>
                                        <div className="flex-1 space-y-0.5 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm">{alerta.tipo}</p>
                                            <p className="text-xs text-gray-600 truncate">{alerta.insumo}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'stockInsumos':
                return (
                    <Card className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Insumos con Stock Bajo</CardTitle>
                                <Link href="/dashboard/inventario" className="text-xs text-green-600 hover:underline">
                                    Ver todos
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-auto max-h-[300px]">
                            <div className="space-y-3">
                                {insumosBajoStock.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-4">Stock suficiente</p>
                                ) : (
                                    insumosBajoStock.map((insumo) => (
                                        <div key={insumo.id} className={`flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 rounded-lg p-2 -mx-2 ${insumo.estado === 'critico' ? 'bg-red-50' : 'bg-amber-50'}`}>
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 text-sm truncate">{insumo.nombre}</p>
                                                <p className="text-xs text-gray-500">{insumo.categoria}</p>
                                            </div>
                                            <div className="text-right ml-2">
                                                <p className={`font-semibold text-sm ${insumo.estado === 'critico' ? 'text-red-600' : 'text-amber-600'}`}>
                                                    {insumo.stockTotal} {insumo.unidad}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'clientesActivos':
                return (
                    <Card className={`relative group h-full overflow-hidden ${draggedStyles}`}>
                        {dragHandle}
                        {removeButton}
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Clientes con Saldo</CardTitle>
                                <Link href="/dashboard/ventas" className="text-xs text-green-600 hover:underline">
                                    Ver todos
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-auto max-h-[300px]">
                            <div className="space-y-3">
                                {clientesConSaldo.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-4">Sin saldos pendientes</p>
                                ) : (
                                    clientesConSaldo.map((cliente) => (
                                        <div key={cliente.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 text-sm truncate">{cliente.nombre}</p>
                                                <p className="text-xs text-gray-500">{cliente.tipo}</p>
                                            </div>
                                            <p className="font-semibold text-red-600 text-sm ml-2">
                                                ${cliente.saldoPendiente.toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Resumen general de tu operación agrícola
                    </p>
                </div>
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings2 className="h-4 w-4" />
                            Personalizar
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Personalizar Dashboard
                            </SheetTitle>
                            <SheetDescription>
                                Elige una plantilla y arrastra los widgets a los espacios disponibles.
                            </SheetDescription>
                        </SheetHeader>

                        <Tabs defaultValue="templates" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="templates">
                                    <LayoutGrid className="h-4 w-4 mr-2" />
                                    Plantillas
                                </TabsTrigger>
                                <TabsTrigger value="widgets">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Widgets
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="templates" className="mt-4 space-y-4">
                                <p className="text-sm text-gray-600">Selecciona cómo organizar tu dashboard:</p>
                                <div className="grid gap-3">
                                    {layoutTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            onClick={() => saveLayout(template.id)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTemplate === template.id
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
                                                    <Badge variant="default" className="bg-green-500">Activo</Badge>
                                                )}
                                            </div>
                                            {/* Mini preview */}
                                            <div className={`mt-3 grid ${template.gridClass} gap-1 h-16`}>
                                                {template.slots.slice(0, 8).map((slot) => (
                                                    <div
                                                        key={slot.id}
                                                        className={`${slot.gridClass} bg-gray-200 rounded ${selectedTemplate === template.id ? 'bg-green-200' : ''}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="widgets" className="mt-4 space-y-4">
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
                                                <Badge variant="secondary" className="ml-auto text-xs">
                                                    {categoryWidgets.filter(w => w.enabled).length}/{categoryWidgets.length}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {categoryWidgets.map((widget) => (
                                                    <div
                                                        key={widget.id}
                                                        className="flex items-center justify-between gap-3 p-2 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <Label htmlFor={widget.id} className="text-sm font-medium cursor-pointer">
                                                                {widget.name}
                                                            </Label>
                                                        </div>
                                                        <Switch
                                                            id={widget.id}
                                                            checked={widget.enabled}
                                                            onCheckedChange={() => toggleWidget(widget.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <Separator className="mt-3" />
                                        </div>
                                    );
                                })}
                            </TabsContent>
                        </Tabs>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Unplaced widgets tray */}
            {unplacedWidgets.length > 0 && (
                <Card className="p-4">
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
                </Card>
            )}

            {/* Dashboard grid */}
            <div className={`grid ${currentTemplate.gridClass} gap-4 auto-rows-[minmax(120px,auto)]`}>
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
                                // Show ghost preview of the dragged widget
                                renderGhostPreview(draggedWidget, slot.size)
                            ) : hasWidget ? (
                                renderWidget(widgetId, slot.size, slot.id)
                            ) : (
                                <div
                                    className={`h-full border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 ${draggedWidget
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
                <Card className="p-12">
                    <div className="text-center">
                        <Settings2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay widgets activos</h3>
                        <p className="mt-2 text-sm text-gray-500">Personaliza tu dashboard activando los widgets que quieres ver.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsOpen(true)}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Personalizar Dashboard
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
