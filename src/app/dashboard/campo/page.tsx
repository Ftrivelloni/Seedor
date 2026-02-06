import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import {
  createHarvestRecordAction,
  createLotAction,
  createTaskAction,
} from '@/app/dashboard/campo/actions';
import { TaskKanbanBoard } from '@/components/dashboard/TaskKanbanBoard';

export default async function CampoPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [fields, workers, tasks, inventoryItems, warehouses, recentHarvests] = await Promise.all([
    prisma.field.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        lots: {
          include: {
            taskLinks: {
              include: {
                task: {
                  select: {
                    id: true,
                    costValue: true,
                    status: true,
                  },
                },
              },
            },
            harvestRecords: {
              select: {
                kilos: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.worker.findMany({
      where: {
        tenantId: session.tenantId,
        active: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.task.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        lotLinks: {
          include: {
            lot: {
              select: {
                name: true,
              },
            },
          },
        },
        workerAssignments: {
          include: {
            worker: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        subtasks: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        tenantId: session.tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.warehouse.findMany({
      where: {
        tenantId: session.tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.harvestRecord.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        lot: {
          select: {
            name: true,
            field: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        harvestDate: 'desc',
      },
      take: 10,
    }),
  ]);

  const now = new Date();
  const kanbanTasks = tasks.map((task) => {
    const calculatedStatus =
      task.status !== 'COMPLETED' && task.dueDate < now && task.status !== 'LATE'
        ? 'LATE'
        : task.status;

    const completedSubtasks = task.subtasks.filter((subtask) => subtask.status === 'COMPLETED').length;
    const subtaskProgress = task.subtasks.length
      ? Math.round((completedSubtasks / task.subtasks.length) * 100)
      : 0;

    return {
      id: task.id,
      description: task.description,
      taskType: task.taskType,
      dueDate: task.dueDate.toISOString(),
      status: calculatedStatus,
      lots: task.lotLinks.map((link) => link.lot.name),
      workers: task.workerAssignments.map(
        (assignment) => `${assignment.worker.firstName} ${assignment.worker.lastName}`
      ),
      isComposite: task.isComposite,
      subtaskProgress,
    };
  });

  const totalLotes = fields.reduce((acc, field) => acc + field.lots.length, 0);
  const tareasActivas = tasks.filter((task) => ['PENDING', 'IN_PROGRESS', 'LATE'].includes(task.status)).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Campo</h1>
        <p className="text-sm text-gray-600">
          Gestión de campos, lotes, tareas, cosecha y rendimiento operativo.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="text-xs font-medium uppercase tracking-wide">Campos</p>
          <p className="mt-2 text-2xl font-semibold">{fields.length}</p>
        </article>
        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p className="text-xs font-medium uppercase tracking-wide">Lotes</p>
          <p className="mt-2 text-2xl font-semibold">{totalLotes}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-xs font-medium uppercase tracking-wide">Tareas activas</p>
          <p className="mt-2 text-2xl font-semibold">{tareasActivas}</p>
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Gestión de campos y lotes</h2>
        <p className="mt-1 text-sm text-gray-600">
          Cada lote muestra superficie, tipo de producción y última fecha de tarea registrada.
        </p>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {fields.map((field) => (
            <article key={field.id} className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900">{field.name}</h3>
              <p className="text-xs text-gray-500">
                {field.location || 'Sin ubicación'} • {field.lots.length} lote(s)
              </p>

              <div className="mt-3 space-y-2">
                {field.lots.map((lot) => {
                  const taskCost = lot.taskLinks.reduce(
                    (acc, link) => acc + Number(link.task.costValue || 0),
                    0
                  );
                  const totalHarvestKilos = lot.harvestRecords.reduce((acc, harvest) => acc + harvest.kilos, 0);

                  return (
                    <div key={lot.id} className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{lot.name}</p>
                        <p className="text-xs text-gray-500">{lot.areaHectares} ha</p>
                      </div>
                      <p className="text-xs text-gray-600">Producción: {lot.productionType}</p>
                      <p className="text-xs text-gray-600">
                        Última tarea: {lot.lastTaskAt ? lot.lastTaskAt.toLocaleDateString('es-AR') : 'Sin tareas'}
                      </p>
                      <p className="text-xs text-gray-600">Costo acumulado tareas: $ {taskCost.toLocaleString('es-AR')}</p>
                      <p className="text-xs text-gray-600">Kilos cosechados: {totalHarvestKilos.toLocaleString('es-AR')} kg</p>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <form action={createLotAction} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select name="fieldId" required className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
            <option value="">Campo</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
          <input name="name" required placeholder="Nombre del lote" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="areaHectares" type="number" min="0.01" step="0.01" required placeholder="Hectáreas" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="productionType" required placeholder="Tipo de producción" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <div className="flex gap-2">
            <input name="plantedFruitsDescription" placeholder="Frutas plantadas" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Agregar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Gestión de tareas</h2>
        <p className="mt-1 text-sm text-gray-600">
          Estados: pendiente, en progreso, completada y atrasada. Arrastrá tareas entre columnas para actualizar estado.
        </p>

        <form action={createTaskAction} className="mt-4 grid gap-3 lg:grid-cols-2">
          <input name="description" required placeholder="Descripción de la tarea" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="taskType" required placeholder="Tipo de tarea" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="startDate" type="datetime-local" required className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="dueDate" type="datetime-local" required className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="costValue" type="number" min="0" step="0.01" placeholder="Costo (valor)" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="costUnit" placeholder="Unidad de costo (ej: por hectárea)" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isComposite" value="true" className="h-4 w-4 rounded border-gray-300" />
            Tarea compuesta (con subtareas)
          </label>

          <div className="lg:col-span-2 grid gap-3 lg:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Lotes involucrados (selección múltiple)</span>
              <select name="lotIds" multiple required className="h-36 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {fields.flatMap((field) =>
                  field.lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {field.name} · {lot.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Trabajadores asignados (selección múltiple)</span>
              <select name="workerIds" multiple className="h-36 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.firstName} {worker.lastName} · {worker.functionType}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Insumos utilizados (opcional, hasta 3 líneas)</p>
            <p className="text-xs text-gray-500">
              Cada consumo descuenta stock automáticamente del inventario.
            </p>

            <div className="mt-3 grid gap-2 lg:grid-cols-4">
              {[0, 1, 2].map((row) => (
                <div key={row} className="contents">
                  <select name="usageItemId" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Insumo</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} · {item.name}
                      </option>
                    ))}
                  </select>
                  <select name="usageWarehouseId" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Depósito</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="usageQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cantidad"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="usageUnit"
                    placeholder="Unidad"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Crear tarea
            </button>
          </div>
        </form>

        <div className="mt-5">
          <TaskKanbanBoard tasks={kanbanTasks} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Gestión de cosecha</h2>
          <p className="mt-1 text-sm text-gray-600">
            Registro de cosecha por lote y cultivo para análisis productivo y ventas futuras.
          </p>

          <form action={createHarvestRecordAction} className="mt-4 grid gap-3">
            <select name="lotId" required className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Lote</option>
              {fields.flatMap((field) =>
                field.lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {field.name} · {lot.name}
                  </option>
                ))
              )}
            </select>
            <input name="cropType" required placeholder="Cultivo" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="kilos" type="number" min="0.01" step="0.01" required placeholder="Kilos cosechados" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="harvestDate" type="datetime-local" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <button type="submit" className="w-fit rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Registrar cosecha
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {recentHarvests.map((harvest) => (
              <div key={harvest.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-900">{harvest.cropType}</p>
                <p className="text-xs text-gray-600">
                  {harvest.lot.field.name} · {harvest.lot.name} · {harvest.kilos.toLocaleString('es-AR')} kg
                </p>
                <p className="text-xs text-gray-500">{harvest.harvestDate.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Rendimiento por lote</h2>
          <p className="mt-1 text-sm text-gray-600">
            Vista consolidada de costos de tareas, gastos acumulados y kilos cosechados.
          </p>

          <div className="mt-4 space-y-2">
            {fields.flatMap((field) =>
              field.lots.map((lot) => {
                const taskCost = lot.taskLinks.reduce((acc, link) => acc + Number(link.task.costValue || 0), 0);
                const totalHarvestKilos = lot.harvestRecords.reduce((acc, harvest) => acc + harvest.kilos, 0);
                const expenses = taskCost;

                return (
                  <div key={lot.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-900">
                      {field.name} · {lot.name}
                    </p>
                    <p className="text-xs text-gray-600">Costos de tareas: $ {taskCost.toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-600">Gastos acumulados: $ {expenses.toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-600">Cosecha: {totalHarvestKilos.toLocaleString('es-AR')} kg</p>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
