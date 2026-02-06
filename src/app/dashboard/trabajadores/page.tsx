import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import {
  createWorkerAction,
  updateWorkerActiveStatusAction,
  updateWorkerPaymentStatusAction,
} from '@/app/dashboard/trabajadores/actions';

function paymentTypeLabel(value: string) {
  if (value === 'HOURLY') return 'Por hora';
  if (value === 'PER_TASK') return 'Por tarea';
  if (value === 'FIXED_SALARY') return 'Sueldo fijo';
  return value;
}

function paymentStatusLabel(value: string) {
  if (value === 'PENDING') return 'Pendiente';
  if (value === 'PARTIAL') return 'Parcial';
  if (value === 'PAID') return 'Pagado';
  return value;
}

export default async function TrabajadoresPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const workers = await prisma.worker.findMany({
    where: {
      tenantId: session.tenantId,
    },
    include: {
      taskAssignments: {
        include: {
          task: {
            select: {
              status: true,
            },
          },
        },
      },
      workLogs: {
        select: {
          hoursWorked: true,
          paymentAmount: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const activeWorkers = workers.filter((worker) => worker.active).length;
  const pendingPayments = workers.filter((worker) => worker.paymentStatus !== 'PAID').length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Trabajadores</h1>
        <p className="text-sm text-gray-600">
          Alta y seguimiento de personal operativo, horas, tareas y estado de pagos.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p className="text-xs font-medium uppercase tracking-wide">Trabajadores totales</p>
          <p className="mt-2 text-2xl font-semibold">{workers.length}</p>
        </article>
        <article className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="text-xs font-medium uppercase tracking-wide">Activos</p>
          <p className="mt-2 text-2xl font-semibold">{activeWorkers}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-xs font-medium uppercase tracking-wide">Pagos por regularizar</p>
          <p className="mt-2 text-2xl font-semibold">{pendingPayments}</p>
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Registrar trabajador</h2>
        <form action={createWorkerAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="firstName" required placeholder="Nombre" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="lastName" required placeholder="Apellido" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="dni" required placeholder="DNI" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="phone" required placeholder="Teléfono" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <input name="email" placeholder="Email (opcional)" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />

          <select name="paymentType" defaultValue="HOURLY" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
            <option value="HOURLY">Pago por hora</option>
            <option value="PER_TASK">Pago por tarea</option>
            <option value="FIXED_SALARY">Sueldo fijo</option>
          </select>

          <input
            name="functionType"
            required
            placeholder="Función principal (ej: tractorista)"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />

          <div className="grid grid-cols-3 gap-2 xl:col-span-1">
            <input name="hourlyRate" type="number" min="0" step="0.01" placeholder="Valor hora" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="taskRate" type="number" min="0" step="0.01" placeholder="Valor tarea" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            <input name="fixedSalary" type="number" min="0" step="0.01" placeholder="Sueldo" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          </div>

          <div className="xl:col-span-4">
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
              Guardar trabajador
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Trabajador</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Modalidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Función</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estadísticas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pago</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {workers.map((worker) => {
                const completedTasks = worker.taskAssignments.filter(
                  (assignment) => assignment.task.status === 'COMPLETED'
                ).length;

                const pendingTasks = worker.taskAssignments.filter((assignment) =>
                  ['PENDING', 'IN_PROGRESS', 'LATE'].includes(assignment.task.status)
                ).length;

                const totalHours = worker.workLogs.reduce(
                  (acc, log) => acc + (log.hoursWorked || 0),
                  0
                );

                const totalPayments = worker.workLogs.reduce(
                  (acc, log) => acc + (log.paymentAmount || 0),
                  0
                );

                const paymentValue =
                  worker.paymentType === 'HOURLY'
                    ? `$ ${Number(worker.hourlyRate || 0).toLocaleString('es-AR')} / hora`
                    : worker.paymentType === 'PER_TASK'
                      ? `$ ${Number(worker.taskRate || 0).toLocaleString('es-AR')} / tarea`
                      : `$ ${Number(worker.fixedSalary || 0).toLocaleString('es-AR')} / mes`;

                return (
                  <tr key={worker.id}>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-gray-900">
                        {worker.firstName} {worker.lastName}
                      </p>
                      <p className="text-xs text-gray-500">DNI: {worker.dni}</p>
                      <p className="text-xs text-gray-500">{worker.phone}</p>
                      {worker.email ? <p className="text-xs text-gray-500">{worker.email}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {paymentTypeLabel(worker.paymentType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{worker.functionType}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <p>Tareas completadas: {completedTasks}</p>
                      <p>Tareas pendientes: {pendingTasks}</p>
                      <p>Horas trabajadas: {totalHours.toLocaleString('es-AR')}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <p>{paymentValue}</p>
                      <p className="text-gray-500">
                        Pagos registrados: $ {totalPayments.toLocaleString('es-AR')}
                      </p>
                    </td>
                    <td className="space-y-2 px-4 py-3 text-xs">
                      <form action={updateWorkerPaymentStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="workerId" value={worker.id} />
                        <select
                          name="paymentStatus"
                          defaultValue={worker.paymentStatus}
                          className="rounded-md border border-gray-300 px-2 py-1.5"
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="PARTIAL">Parcial</option>
                          <option value="PAID">Pagado</option>
                        </select>
                        <button type="submit" className="rounded-md border border-gray-300 px-2 py-1.5 hover:bg-gray-100">
                          Guardar
                        </button>
                      </form>

                      <form action={updateWorkerActiveStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="workerId" value={worker.id} />
                        <select
                          name="active"
                          defaultValue={String(worker.active)}
                          className="rounded-md border border-gray-300 px-2 py-1.5"
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                        <button type="submit" className="rounded-md border border-gray-300 px-2 py-1.5 hover:bg-gray-100">
                          Guardar
                        </button>
                      </form>

                      <p className="text-gray-500">Estado pago: {paymentStatusLabel(worker.paymentStatus)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
