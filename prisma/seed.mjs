import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function clearDatabase() {
  await prisma.dashboardPreference.deleteMany();
  await prisma.tenantModuleSetting.deleteMany();
  await prisma.extraordinaryItemRequest.deleteMany();
  await prisma.taskInventoryUsage.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.taskWorkLog.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.taskLot.deleteMany();
  await prisma.task.deleteMany();
  await prisma.harvestRecord.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.field.deleteMany();
  await prisma.tenantUserMembership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

async function main() {
  await clearDatabase();

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Seedor Demo',
      slug: 'seedor-demo',
    },
  });

  const admin = await prisma.user.create({
    data: {
      firstName: 'Ana',
      lastName: 'Pereyra',
      email: 'admin@seedor.app',
      phone: '+54 351 4000001',
      passwordHash: hashPassword('admin123'),
      role: 'ADMIN',
      status: 'ACTIVE',
      lastAccessAt: new Date(),
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      firstName: 'Martín',
      lastName: 'Gómez',
      email: 'supervisor@seedor.app',
      phone: '+54 351 4000002',
      passwordHash: hashPassword('super123'),
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      lastAccessAt: new Date(),
    },
  });

  const invited = await prisma.user.create({
    data: {
      firstName: 'Laura',
      lastName: 'Quinteros',
      email: 'laura@seedor.app',
      phone: '+54 351 4000003',
      passwordHash: hashPassword('temporal123'),
      role: 'SUPERVISOR',
      status: 'INVITED',
      invitedById: admin.id,
    },
  });

  await prisma.tenantUserMembership.createMany({
    data: [
      { tenantId: tenant.id, userId: admin.id },
      { tenantId: tenant.id, userId: supervisor.id },
      { tenantId: tenant.id, userId: invited.id },
    ],
  });

  await prisma.tenantModuleSetting.createMany({
    data: [
      { tenantId: tenant.id, module: 'DASHBOARD', enabled: true },
      { tenantId: tenant.id, module: 'USERS', enabled: true },
      { tenantId: tenant.id, module: 'WORKERS', enabled: true },
      { tenantId: tenant.id, module: 'FIELD', enabled: true },
      { tenantId: tenant.id, module: 'INVENTORY', enabled: true },
      { tenantId: tenant.id, module: 'MACHINERY', enabled: false },
      { tenantId: tenant.id, module: 'PACKAGING', enabled: false },
      { tenantId: tenant.id, module: 'SALES', enabled: false },
      { tenantId: tenant.id, module: 'SETTINGS', enabled: false },
    ],
  });

  const campoNorte = await prisma.field.create({
    data: {
      tenantId: tenant.id,
      name: 'Campo Norte',
      location: 'Cruz del Eje',
      description: 'Campo principal con producción cítrica.',
    },
  });

  const campoSur = await prisma.field.create({
    data: {
      tenantId: tenant.id,
      name: 'Campo Sur',
      location: 'Villa del Totoral',
      description: 'Campo secundario para expansión de producción.',
    },
  });

  const lotes = await Promise.all([
    prisma.lot.create({
      data: {
        tenantId: tenant.id,
        fieldId: campoNorte.id,
        name: 'Lote N-01',
        areaHectares: 28,
        productionType: 'Naranja',
        plantedFruitsDescription: 'Naranja Valencia Late',
      },
    }),
    prisma.lot.create({
      data: {
        tenantId: tenant.id,
        fieldId: campoNorte.id,
        name: 'Lote N-02',
        areaHectares: 22,
        productionType: 'Limón',
        plantedFruitsDescription: 'Limón Eureka',
      },
    }),
    prisma.lot.create({
      data: {
        tenantId: tenant.id,
        fieldId: campoSur.id,
        name: 'Lote S-01',
        areaHectares: 31,
        productionType: 'Mandarina',
        plantedFruitsDescription: 'Mandarina Okitsu',
      },
    }),
  ]);

  const trabajadores = await Promise.all([
    prisma.worker.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Juan',
        lastName: 'Rojas',
        dni: '30111222',
        phone: '+54 351 6000001',
        email: 'juan.rojas@seedor.app',
        paymentType: 'HOURLY',
        functionType: 'Tractorista',
        hourlyRate: 5500,
        paymentStatus: 'PENDING',
      },
    }),
    prisma.worker.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Micaela',
        lastName: 'Sosa',
        dni: '28999111',
        phone: '+54 351 6000002',
        paymentType: 'PER_TASK',
        functionType: 'Cosechadora',
        taskRate: 21000,
        paymentStatus: 'PARTIAL',
      },
    }),
    prisma.worker.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Carlos',
        lastName: 'Paz',
        dni: '27666777',
        phone: '+54 351 6000003',
        paymentType: 'FIXED_SALARY',
        functionType: 'Encargado de campo',
        fixedSalary: 890000,
        paymentStatus: 'PAID',
      },
    }),
  ]);

  const depositoCentral = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'Depósito Central',
      description: 'Depósito principal para insumos de campo.',
    },
  });

  const depositoSecundario = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'Depósito Secundario',
      description: 'Depósito de apoyo para tareas operativas.',
    },
  });

  const items = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        code: 'INS-0001',
        name: 'Glifosato 48%',
        description: 'Herbicida de uso general',
        unit: 'L',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        code: 'INS-0002',
        name: 'Fertilizante NPK',
        description: 'Fertilizante granulado 15-15-15',
        unit: 'kg',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        code: 'INS-0003',
        name: 'Coadyuvante',
        description: 'Aditivo para pulverización',
        unit: 'L',
      },
    }),
  ]);

  await prisma.warehouseStock.createMany({
    data: [
      {
        warehouseId: depositoCentral.id,
        itemId: items[0].id,
        quantity: 180,
        lowThreshold: 80,
        criticalThreshold: 40,
      },
      {
        warehouseId: depositoCentral.id,
        itemId: items[1].id,
        quantity: 420,
        lowThreshold: 180,
        criticalThreshold: 90,
      },
      {
        warehouseId: depositoCentral.id,
        itemId: items[2].id,
        quantity: 75,
        lowThreshold: 30,
        criticalThreshold: 15,
      },
      {
        warehouseId: depositoSecundario.id,
        itemId: items[0].id,
        quantity: 42,
        lowThreshold: 35,
        criticalThreshold: 20,
      },
      {
        warehouseId: depositoSecundario.id,
        itemId: items[1].id,
        quantity: 130,
        lowThreshold: 120,
        criticalThreshold: 70,
      },
      {
        warehouseId: depositoSecundario.id,
        itemId: items[2].id,
        quantity: 20,
        lowThreshold: 15,
        criticalThreshold: 8,
      },
    ],
  });

  const tarea1 = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      description: 'Aplicación de herbicida en lotes del campo norte',
      taskType: 'Aplicación herbicida',
      status: 'IN_PROGRESS',
      costValue: 13500,
      costUnit: 'por hectárea',
      startDate: new Date('2026-02-03T08:00:00.000Z'),
      dueDate: new Date('2026-02-08T18:00:00.000Z'),
      createdById: admin.id,
    },
  });

  const tarea2 = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      description: 'Riego y control de humedad en lote S-01',
      taskType: 'Riego',
      status: 'PENDING',
      costValue: 7000,
      costUnit: 'por hora',
      startDate: new Date('2026-02-07T07:30:00.000Z'),
      dueDate: new Date('2026-02-10T18:00:00.000Z'),
      createdById: supervisor.id,
    },
  });

  const tareaCompuesta = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      description: 'Preparación integral de lote N-02',
      taskType: 'Tarea compuesta',
      status: 'IN_PROGRESS',
      isComposite: true,
      startDate: new Date('2026-02-01T08:00:00.000Z'),
      dueDate: new Date('2026-02-12T18:00:00.000Z'),
      createdById: admin.id,
    },
  });

  const subtarea1 = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      parentTaskId: tareaCompuesta.id,
      description: 'Limpieza de surcos',
      taskType: 'Limpieza',
      status: 'COMPLETED',
      startDate: new Date('2026-02-01T08:00:00.000Z'),
      dueDate: new Date('2026-02-02T18:00:00.000Z'),
      completedAt: new Date('2026-02-02T15:00:00.000Z'),
      createdById: admin.id,
    },
  });

  const subtarea2 = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      parentTaskId: tareaCompuesta.id,
      description: 'Aplicación de fertilizante base',
      taskType: 'Fertilización',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-02-03T08:00:00.000Z'),
      dueDate: new Date('2026-02-09T18:00:00.000Z'),
      createdById: supervisor.id,
    },
  });

  await prisma.taskLot.createMany({
    data: [
      { taskId: tarea1.id, lotId: lotes[0].id },
      { taskId: tarea1.id, lotId: lotes[1].id },
      { taskId: tarea2.id, lotId: lotes[2].id },
      { taskId: tareaCompuesta.id, lotId: lotes[1].id },
      { taskId: subtarea1.id, lotId: lotes[1].id },
      { taskId: subtarea2.id, lotId: lotes[1].id },
    ],
  });

  await prisma.taskAssignment.createMany({
    data: [
      { taskId: tarea1.id, workerId: trabajadores[0].id },
      { taskId: tarea1.id, workerId: trabajadores[1].id },
      { taskId: tarea2.id, workerId: trabajadores[2].id },
      { taskId: subtarea2.id, workerId: trabajadores[1].id },
    ],
  });

  await prisma.taskWorkLog.createMany({
    data: [
      {
        taskId: tarea1.id,
        workerId: trabajadores[0].id,
        hoursWorked: 6,
        paymentAmount: 33000,
        paymentStatus: 'PENDING',
      },
      {
        taskId: tarea1.id,
        workerId: trabajadores[1].id,
        hoursWorked: 5,
        paymentAmount: 21000,
        paymentStatus: 'PARTIAL',
      },
      {
        taskId: subtarea1.id,
        workerId: trabajadores[1].id,
        hoursWorked: 4,
        paymentAmount: 21000,
        paymentStatus: 'PAID',
      },
    ],
  });

  const consumoTarea1 = await prisma.inventoryMovement.create({
    data: {
      tenantId: tenant.id,
      type: 'CONSUMPTION',
      itemId: items[0].id,
      quantity: 25,
      sourceWarehouseId: depositoCentral.id,
      referenceTaskId: tarea1.id,
      notes: 'Consumo por aplicación en lotes N-01 y N-02',
      createdByUserId: supervisor.id,
    },
  });

  await prisma.taskInventoryUsage.create({
    data: {
      taskId: tarea1.id,
      inventoryItemId: items[0].id,
      warehouseId: depositoCentral.id,
      quantity: 25,
      unit: 'L',
      movementId: consumoTarea1.id,
    },
  });

  await prisma.inventoryMovement.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: 'INCOME',
        itemId: items[1].id,
        quantity: 180,
        destinationWarehouseId: depositoCentral.id,
        notes: 'Ingreso por compra OC-1007',
        createdByUserId: admin.id,
      },
      {
        tenantId: tenant.id,
        type: 'TRANSFER',
        itemId: items[2].id,
        quantity: 10,
        sourceWarehouseId: depositoCentral.id,
        destinationWarehouseId: depositoSecundario.id,
        notes: 'Reabastecimiento semanal',
        createdByUserId: supervisor.id,
      },
    ],
  });

  await prisma.harvestRecord.createMany({
    data: [
      {
        tenantId: tenant.id,
        lotId: lotes[0].id,
        cropType: 'Naranja Valencia Late',
        kilos: 12400,
        harvestDate: new Date('2026-01-28T15:00:00.000Z'),
      },
      {
        tenantId: tenant.id,
        lotId: lotes[1].id,
        cropType: 'Limón Eureka',
        kilos: 9800,
        harvestDate: new Date('2026-02-01T14:00:00.000Z'),
      },
      {
        tenantId: tenant.id,
        lotId: lotes[2].id,
        cropType: 'Mandarina Okitsu',
        kilos: 11250,
        harvestDate: new Date('2026-02-02T16:00:00.000Z'),
      },
    ],
  });

  await prisma.extraordinaryItemRequest.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Repuesto de bomba hidráulica',
        description: 'Necesario para reparar pulverizadora.',
        requestedByUserId: supervisor.id,
        requestedAt: new Date('2026-02-04T09:00:00.000Z'),
        status: 'PENDING',
      },
      {
        tenantId: tenant.id,
        name: 'Juego de herramientas de poda',
        description: 'Pedido para cuadrilla del campo sur.',
        requestedByUserId: admin.id,
        requestedAt: new Date('2026-02-02T13:00:00.000Z'),
        status: 'DELIVERED',
        deliveredAt: new Date('2026-02-05T11:30:00.000Z'),
      },
    ],
  });

  await prisma.dashboardPreference.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: admin.id,
        templateKey: 'balanced',
        widgetsJson: JSON.stringify([
          'open_tasks',
          'stock_alerts',
          'pending_payments',
          'harvest_kilos',
          'inventory_movements',
        ]),
      },
      {
        tenantId: tenant.id,
        userId: supervisor.id,
        templateKey: 'operations',
        widgetsJson: JSON.stringify([
          'open_tasks',
          'today_tasks',
          'stock_alerts',
          'extraordinary_items',
        ]),
      },
    ],
  });

  await prisma.lot.update({
    where: { id: lotes[0].id },
    data: { lastTaskAt: new Date('2026-02-03T08:00:00.000Z') },
  });

  await prisma.lot.update({
    where: { id: lotes[1].id },
    data: { lastTaskAt: new Date('2026-02-03T08:00:00.000Z') },
  });

  await prisma.lot.update({
    where: { id: lotes[2].id },
    data: { lastTaskAt: new Date('2026-02-07T07:30:00.000Z') },
  });

  console.log('Database seeded successfully.');
  console.log('Admin login: admin@seedor.app / admin123');
  console.log('Supervisor login: supervisor@seedor.app / super123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
