'use client';

import { useState, useMemo, useCallback, useRef, useId, useEffect } from 'react';
import { Settings2, Plus, GripVertical, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardData, TemplateKey, WidgetSize } from './dashboard-types';
import { WIDGET_CATALOG } from './dashboard-types';
import { renderWidget } from './widgets/DashboardWidgets';
import CustomizeSidebar from './CustomizeSidebar';
import { updateWidgetOrderAction } from './actions';

/* ════════════════════════════════════════
   Props
   ════════════════════════════════════════ */
interface Props {
  data: DashboardData;
  templateKey: TemplateKey;
  enabledWidgets: string[];
  isAdmin: boolean;
}

/* ════════════════════════════════════════
   Layout engine
   Each template maps widgets to CSS-grid
   areas with col/row spans.
   ════════════════════════════════════════ */
interface CellStyle {
  colSpan: number;
  rowSpan: number;
}

function getWidgetColSpan(size: WidgetSize | undefined, template: TemplateKey): number {
  if (size === 'kpi') return 1;
  // medium / large
  if (template === 'sidebar-left' || template === 'sidebar-right') return 3;
  return 2; // balanced, panel-left, panel-right
}

/**
 * Sort widgets according to a template's intended layout.
 * Called when the user saves from Personalizar to enforce template order.
 */
function sortWidgetsByTemplate(template: TemplateKey, widgets: string[]): string[] {
  const kpis = widgets.filter((id) => {
    const def = WIDGET_CATALOG.find((w) => w.id === id);
    return def?.size === 'kpi';
  });
  const mediums = widgets.filter((id) => {
    const def = WIDGET_CATALOG.find((w) => w.id === id);
    return def?.size === 'medium' || def?.size === 'large';
  });

  switch (template) {
    case 'balanced':
    case 'panel-left':
    case 'sidebar-left':
      // KPIs first, then mediums
      return [...kpis, ...mediums];
    case 'panel-right':
    case 'sidebar-right':
      // Mediums first, then KPIs
      return [...mediums, ...kpis];
    default:
      return widgets;
  }
}

function resolveGridCells(
  template: TemplateKey,
  widgets: string[],
): { id: string; style: CellStyle }[] {
  // Preserve the exact order the user arranged via drag-and-drop.
  // Each widget simply gets its colSpan/rowSpan based on its own size definition.
  return widgets.map((id) => {
    const def = WIDGET_CATALOG.find((w) => w.id === id);
    const colSpan = getWidgetColSpan(def?.size, template);
    return { id, style: { colSpan, rowSpan: 1 } };
  });
}

/* ════════════════════════════════════════
   Sortable Widget Card
   ════════════════════════════════════════ */
function SortableWidgetCard({
  widgetId,
  colSpan,
  rowSpan,
  data,
  onRemove,
}: {
  widgetId: string;
  colSpan: number;
  rowSpan: number;
  data: DashboardData;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId });

  const def = WIDGET_CATALOG.find((w) => w.id === widgetId);
  const isKpi = def?.size === 'kpi';

  const style = {
    gridColumn: `span ${colSpan}`,
    gridRow: `span ${rowSpan}`,
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as number | string,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 transition-shadow hover:shadow-md ${isKpi ? 'min-h-[120px]' : 'min-h-[240px]'
        } ${isDragging ? 'ring-2 ring-green-400/50' : ''}`}
    >
      {/* ── Hover controls (top-right) ── */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100/80 hover:bg-gray-200/90 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-all duration-150 backdrop-blur-sm"
          aria-label="Arrastrar widget"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(widgetId)}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100/80 hover:bg-red-100/90 text-gray-400 hover:text-red-500 transition-all duration-150 backdrop-blur-sm"
          aria-label="Eliminar widget"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {renderWidget(widgetId, data)}
    </div>
  );
}

/* ════════════════════════════════════════
   Static Widget Card (for DragOverlay)
   ════════════════════════════════════════ */
function StaticWidgetCard({
  widgetId,
  colSpan,
  rowSpan,
  data,
}: {
  widgetId: string;
  colSpan: number;
  rowSpan: number;
  data: DashboardData;
}) {
  const def = WIDGET_CATALOG.find((w) => w.id === widgetId);
  const isKpi = def?.size === 'kpi';

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-2xl p-5 ring-2 ring-green-500/30 ${isKpi ? 'min-h-[120px]' : 'min-h-[240px]'
        }`}
      style={{
        width: colSpan === 1 ? '25%' : colSpan === 2 ? '50%' : '75%',
        minWidth: colSpan === 1 ? 200 : colSpan === 2 ? 400 : 600,
        opacity: 0.95,
      }}
    >
      {renderWidget(widgetId, data)}
    </div>
  );
}

/* ════════════════════════════════════════
   Main DashboardPageClient
   ════════════════════════════════════════ */
export function DashboardPageClient({ data, templateKey: initialTemplate, enabledWidgets: initialWidgets, isAdmin }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState<TemplateKey>(initialTemplate);
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(initialWidgets);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* Deterministic id for DndContext to avoid hydration mismatch */
  const dndContextId = useId();

  /* Defer DndContext to client-only render to avoid SSR attribute mismatches */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* Debounce timer for persisting order */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Sensors: pointer (mouse/touch) + keyboard for accessibility */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px move before drag starts — avoids accidental drags
      },
    }),
    useSensor(KeyboardSensor),
  );

  /* Filter by admin role */
  const visibleWidgets = useMemo(
    () =>
      enabledWidgets.filter((id) => {
        const def = WIDGET_CATALOG.find((w) => w.id === id);
        if (!def) return false;
        if (def.adminOnly && !isAdmin) return false;
        return true;
      }),
    [enabledWidgets, isAdmin],
  );

  /* Build grid cells */
  const gridCells = useMemo(
    () => resolveGridCells(templateKey, visibleWidgets),
    [templateKey, visibleWidgets],
  );

  /* Persist widget order to DB (debounced) */
  const persistOrder = useCallback(
    (newWidgets: string[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const fd = new FormData();
        fd.set('widgetsJson', JSON.stringify(newWidgets));
        updateWidgetOrderAction(fd).catch(console.error);
      }, 600);
    },
    [],
  );

  /* Drag handlers */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIdx = enabledWidgets.indexOf(String(active.id));
      const newIdx = enabledWidgets.indexOf(String(over.id));
      if (oldIdx === -1 || newIdx === -1) return;

      const newOrder = [...enabledWidgets];
      const [moved] = newOrder.splice(oldIdx, 1);
      newOrder.splice(newIdx, 0, moved);

      setEnabledWidgets(newOrder);
      persistOrder(newOrder);
    },
    [enabledWidgets, persistOrder],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  /* Remove widget */
  const handleRemoveWidget = useCallback(
    (id: string) => {
      const newWidgets = enabledWidgets.filter((w) => w !== id);
      setEnabledWidgets(newWidgets);
      persistOrder(newWidgets);
    },
    [enabledWidgets, persistOrder],
  );

  /* Callback from sidebar save — sort widgets according to template layout */
  const handleUpdate = (template: TemplateKey, widgets: string[]) => {
    const sorted = sortWidgetsByTemplate(template, widgets);
    setTemplateKey(template);
    setEnabledWidgets(sorted);
  };

  /* Data for the active drag overlay */
  const activeCellData = activeId
    ? gridCells.find((c) => c.id === activeId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen en tiempo real de tu operación agrícola
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Personalizar
          </button>
        </div>
      </div>

      {/* ── Widget grid ── */}
      {visibleWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No hay widgets seleccionados
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Hacé clic en &quot;Personalizar&quot; para elegir una plantilla y activar widgets en tu
            dashboard.
          </p>
          <button
            onClick={() => setSidebarOpen(true)}
            className="mt-6 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Agregar widgets
          </button>
        </div>
      ) : !mounted ? (
        /* Static grid for SSR — no DndContext to avoid hydration mismatch */
        <div className="grid grid-cols-4 gap-5 auto-rows-auto">
          {gridCells.map((cell) => {
            const def = WIDGET_CATALOG.find((w) => w.id === cell.id);
            const isKpi = def?.size === 'kpi';
            return (
              <div
                key={cell.id}
                style={{ gridColumn: `span ${cell.style.colSpan}`, gridRow: `span ${cell.style.rowSpan}` }}
                className={`group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 transition-shadow hover:shadow-md ${isKpi ? 'min-h-[120px]' : 'min-h-[240px]'}`}
              >
                {renderWidget(cell.id, data)}
              </div>
            );
          })}
        </div>
      ) : (
        <DndContext
          id={dndContextId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={gridCells.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-4 gap-5 auto-rows-auto">
              {gridCells.map((cell) => (
                <SortableWidgetCard
                  key={cell.id}
                  widgetId={cell.id}
                  colSpan={cell.style.colSpan}
                  rowSpan={cell.style.rowSpan}
                  data={data}
                  onRemove={handleRemoveWidget}
                />
              ))}
            </div>
          </SortableContext>

          {/* ── Drag overlay (floating clone) ── */}
          <DragOverlay
            dropAnimation={{
              duration: 250,
              easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {activeCellData ? (
              <StaticWidgetCard
                widgetId={activeCellData.id}
                colSpan={activeCellData.style.colSpan}
                rowSpan={activeCellData.style.rowSpan}
                data={data}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Customize sidebar ── */}
      <CustomizeSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        templateKey={templateKey}
        enabledWidgets={enabledWidgets}
        isAdmin={isAdmin}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
