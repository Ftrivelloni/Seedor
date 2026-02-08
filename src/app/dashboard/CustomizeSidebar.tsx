'use client';

import { useState, useTransition, useCallback } from 'react';
import { X, LayoutGrid, ToggleRight, Check } from 'lucide-react';
import {
  TEMPLATE_OPTIONS,
  WIDGET_CATALOG,
  MODULE_LABELS,
  type TemplateKey,
  type ModuleKey,
} from './dashboard-types';
import { updateDashboardPreferenceAction } from './actions';

/* ── Mini template previews (pure CSS wireframes) ── */
const TEMPLATE_PREVIEWS: Record<TemplateKey, React.ReactNode> = {
  balanced: (
    <div className="grid grid-cols-4 grid-rows-2 gap-0.5 w-full h-full">
      <div className="bg-gray-300 rounded-sm" />
      <div className="bg-gray-300 rounded-sm" />
      <div className="bg-gray-300 rounded-sm" />
      <div className="bg-gray-300 rounded-sm" />
      <div className="bg-gray-400 rounded-sm col-span-2" />
      <div className="bg-gray-400 rounded-sm col-span-2" />
    </div>
  ),
  'panel-left': (
    <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full">
      <div className="bg-gray-400 rounded-sm row-span-2 col-span-2" />
      <div className="bg-gray-300 rounded-sm" />
      <div className="bg-gray-300 rounded-sm" />
    </div>
  ),
  'panel-right': (
    <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full">
      <div className="bg-gray-300 rounded-sm" />
      <div className="bg-gray-400 rounded-sm row-span-2 col-span-2" />
      <div className="bg-gray-300 rounded-sm" />
    </div>
  ),
  'sidebar-left': (
    <div className="grid grid-cols-4 grid-rows-3 gap-0.5 w-full h-full">
      <div className="bg-gray-300 rounded-sm row-span-3" />
      <div className="bg-gray-400 rounded-sm col-span-3 row-span-1" />
      <div className="bg-gray-400 rounded-sm col-span-3 row-span-1" />
      <div className="bg-gray-400 rounded-sm col-span-3 row-span-1" />
    </div>
  ),
  'sidebar-right': (
    <div className="grid grid-cols-4 grid-rows-3 gap-0.5 w-full h-full">
      <div className="bg-gray-400 rounded-sm col-span-3 row-span-1" />
      <div className="bg-gray-300 rounded-sm row-span-3" />
      <div className="bg-gray-400 rounded-sm col-span-3 row-span-1" />
      <div className="bg-gray-400 rounded-sm col-span-3 row-span-1" />
    </div>
  ),
};

/* ════════════════════════════════════════
   CustomizeSidebar
   ════════════════════════════════════════ */
interface Props {
  open: boolean;
  onClose: () => void;
  templateKey: TemplateKey;
  enabledWidgets: string[];
  isAdmin: boolean;
  onUpdate: (template: TemplateKey, widgets: string[]) => void;
}

export default function CustomizeSidebar({
  open,
  onClose,
  templateKey,
  enabledWidgets,
  isAdmin,
  onUpdate,
}: Props) {
  const [activeTab, setActiveTab] = useState<'plantillas' | 'widgets'>('plantillas');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>(templateKey);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(enabledWidgets);
  const [isPending, startTransition] = useTransition();

  /* Reset local state when opening */
  const handleOpen = useCallback(() => {
    setSelectedTemplate(templateKey);
    setSelectedWidgets(enabledWidgets);
  }, [templateKey, enabledWidgets]);

  /* Save */
  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('templateKey', selectedTemplate);
      fd.set('widgetsJson', JSON.stringify(selectedWidgets));
      await updateDashboardPreferenceAction(fd);
      onUpdate(selectedTemplate, selectedWidgets);
      onClose();
    });
  };

  /* Toggle widget */
  const toggleWidget = (id: string) => {
    setSelectedWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
    );
  };

  /* Group widgets by module */
  const modules = Object.keys(MODULE_LABELS) as ModuleKey[];
  const visibleCatalog = isAdmin
    ? WIDGET_CATALOG
    : WIDGET_CATALOG.filter((w) => !w.adminOnly);

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] max-w-[90vw] bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        onTransitionEnd={() => {
          if (open) handleOpen();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Personalizar Dashboard</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'plantillas'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Plantillas
          </button>
          <button
            onClick={() => setActiveTab('widgets')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'widgets'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ToggleRight className="h-4 w-4" />
            Widgets
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'plantillas' ? (
            <TemplateTab
              selected={selectedTemplate}
              onSelect={setSelectedTemplate}
            />
          ) : (
            <WidgetsTab
              modules={modules}
              catalog={visibleCatalog}
              selected={selectedWidgets}
              onToggle={toggleWidget}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══ Template tab ═══ */
function TemplateTab({
  selected,
  onSelect,
}: {
  selected: TemplateKey;
  onSelect: (k: TemplateKey) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        Elegí una plantilla para definir la distribución de widgets en tu dashboard.
      </p>
      {TEMPLATE_OPTIONS.map((t) => {
        const isActive = selected === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              isActive
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            {/* Mini preview */}
            <div
              className={`w-16 h-12 flex-shrink-0 rounded-md p-1 ${
                isActive ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              {TEMPLATE_PREVIEWS[t.key]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm">{t.label}</span>
                {isActive && <Check className="h-4 w-4 text-green-600" />}
              </div>
              <span className="text-xs text-gray-500 mt-0.5 block">{t.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ═══ Widgets tab ═══ */
function WidgetsTab({
  modules,
  catalog,
  selected,
  onToggle,
}: {
  modules: ModuleKey[];
  catalog: typeof WIDGET_CATALOG;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Activá o desactivá los widgets que quieras mostrar en tu dashboard.
      </p>
      {modules.map((mod) => {
        const items = catalog.filter((w) => w.module === mod);
        if (items.length === 0) return null;
        const enabledCount = items.filter((w) => selected.includes(w.id)).length;
        return (
          <div key={mod}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{MODULE_LABELS[mod]}</h3>
              <span className="text-xs text-gray-400">
                {enabledCount}/{items.length}
              </span>
            </div>
            <div className="space-y-1">
              {items.map((w) => {
                const enabled = selected.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => onToggle(w.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${
                      enabled ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`text-sm ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                      {w.label}
                    </span>
                    {/* Toggle switch */}
                    <div
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        enabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
