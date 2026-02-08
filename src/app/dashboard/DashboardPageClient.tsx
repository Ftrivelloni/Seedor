'use client';

import { useState, useMemo } from 'react';
import { Settings2, Plus } from 'lucide-react';
import type { DashboardData, TemplateKey, WidgetSize } from './dashboard-types';
import { WIDGET_CATALOG } from './dashboard-types';
import { renderWidget } from './widgets/DashboardWidgets';
import CustomizeSidebar from './CustomizeSidebar';

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

function resolveGridCells(
  template: TemplateKey,
  widgets: string[],
): { id: string; style: CellStyle }[] {
  const kpiIds = widgets.filter((id) => {
    const def = WIDGET_CATALOG.find((w) => w.id === id);
    return def?.size === 'kpi';
  });
  const mediumIds = widgets.filter((id) => {
    const def = WIDGET_CATALOG.find((w) => w.id === id);
    return def?.size === 'medium' || def?.size === 'large';
  });

  switch (template) {
    case 'balanced':
      // 4 KPIs top (1 col each in 4-col grid), then medium widgets at 2 cols each
      return [
        ...kpiIds.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } })),
        ...mediumIds.map((id) => ({ id, style: { colSpan: 2, rowSpan: 1 } })),
      ];

    case 'panel-left':
      // First medium widget takes 2 cols + 2 rows, rest stack on the right
      if (mediumIds.length === 0)
        return kpiIds.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } }));
      return [
        { id: mediumIds[0], style: { colSpan: 2, rowSpan: 2 } },
        ...kpiIds.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } })),
        ...mediumIds.slice(1).map((id) => ({ id, style: { colSpan: 2, rowSpan: 1 } })),
      ];

    case 'panel-right':
      // KPIs on the left, big medium widget on the right
      if (mediumIds.length === 0)
        return kpiIds.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } }));
      return [
        ...kpiIds.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } })),
        { id: mediumIds[0], style: { colSpan: 2, rowSpan: 2 } },
        ...mediumIds.slice(1).map((id) => ({ id, style: { colSpan: 2, rowSpan: 1 } })),
      ];

    case 'sidebar-left':
      // KPIs stacked in 1-col sidebar left, medium widgets take 3 cols right
      return [
        ...kpiIds.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } })),
        ...mediumIds.map((id) => ({ id, style: { colSpan: 3, rowSpan: 1 } })),
      ];

    case 'sidebar-right':
      // Medium widgets on left (3 cols), KPI sidebar right
      return [
        ...mediumIds.map((id) => ({ id, style: { colSpan: 3, rowSpan: 1 } })),
        ...kpiIds.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } })),
      ];

    default:
      return widgets.map((id) => ({ id, style: { colSpan: 1, rowSpan: 1 } }));
  }
}

/* ════════════════════════════════════════
   Widget wrapper card
   ════════════════════════════════════════ */
function WidgetCard({
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
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm p-5 transition-shadow hover:shadow-md ${
        isKpi ? 'min-h-[120px]' : 'min-h-[240px]'
      }`}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
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

  /* Callback from sidebar save */
  const handleUpdate = (template: TemplateKey, widgets: string[]) => {
    setTemplateKey(template);
    setEnabledWidgets(widgets);
  };

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
      ) : (
        <div className="grid grid-cols-4 gap-5 auto-rows-auto">
          {gridCells.map((cell) => (
            <WidgetCard
              key={cell.id}
              widgetId={cell.id}
              colSpan={cell.style.colSpan}
              rowSpan={cell.style.rowSpan}
              data={data}
            />
          ))}
        </div>
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
