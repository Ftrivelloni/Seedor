'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';

const revalidateEmpaque = () => revalidatePath('/dashboard/empaque', 'layout');

/* ══════════════ BALANZA ══════════════ */

export async function createTruckEntryAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const remitoNumber = String(formData.get('remitoNumber') || '').trim();
  const dtv = String(formData.get('dtv') || '').trim();
  const transport = String(formData.get('transport') || '').trim();
  const chassis = String(formData.get('chassis') || '').trim() || null;
  const trailer = String(formData.get('trailer') || '').trim() || null;
  const driverName = String(formData.get('driverName') || '').trim();
  const driverDni = String(formData.get('driverDni') || '').trim();
  const producerUnit = String(formData.get('producerUnit') || '').trim() || null;
  const fieldOrigin = String(formData.get('fieldOrigin') || '').trim() || null;

  if (!remitoNumber || !dtv || !transport || !driverName || !driverDni) {
    throw new Error('Complete los campos obligatorios del ingreso.');
  }

  const entry = await prisma.packingTruckEntry.create({
    data: {
      tenantId: session.tenantId,
      remitoNumber,
      dtv,
      transport,
      chassis,
      trailer,
      driverName,
      driverDni,
      operatorId: session.userId,
      producerUnit,
      fieldOrigin,
    },
  });

  revalidateEmpaque();
  return entry.id;
}

export async function finalizeTruckEntryAction(entryId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const entry = await prisma.packingTruckEntry.findFirst({
    where: { id: entryId, tenantId: session.tenantId },
  });
  if (!entry) throw new Error('Ingreso no encontrado.');

  await prisma.packingTruckEntry.update({
    where: { id: entryId },
    data: { status: 'FINALIZED' },
  });

  revalidateEmpaque();
}

export async function createBinAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const truckEntryId = String(formData.get('truckEntryId') || '').trim() || null;
  const fieldName = String(formData.get('fieldName') || '').trim();
  const fruitType = String(formData.get('fruitType') || '').trim();
  const lotName = String(formData.get('lotName') || '').trim();
  const contractor = String(formData.get('contractor') || '').trim() || null;
  const harvestType = String(formData.get('harvestType') || '').trim() || null;
  const binType = String(formData.get('binType') || '').trim() || null;
  const emptyWeight = formData.get('emptyWeight') ? Number(formData.get('emptyWeight')) : null;
  const netWeight = Number(formData.get('netWeight') || 0);
  const isTrazable = formData.get('isTrazable') === 'true';
  const binIdentifier = String(formData.get('binIdentifier') || '').trim() || null;

  if (!fieldName || !fruitType || !lotName || netWeight <= 0) {
    throw new Error('Complete los campos obligatorios del bin.');
  }

  // Generate sequential code
  const year = new Date().getFullYear();
  const lastBin = await prisma.packingBin.findFirst({
    where: { tenantId: session.tenantId, code: { startsWith: `B-${year}-` } },
    orderBy: { code: 'desc' },
  });
  const seq = lastBin ? parseInt(lastBin.code.split('-')[2]) + 1 : 1;
  const code = `B-${year}-${String(seq).padStart(4, '0')}`;

  await prisma.packingBin.create({
    data: {
      tenantId: session.tenantId,
      code,
      binIdentifier,
      fieldName,
      fruitType,
      lotName,
      contractor,
      harvestType,
      binType,
      emptyWeight,
      netWeight,
      isTrazable,
      truckEntryId,
      status: 'IN_YARD',
    },
  });

  revalidateEmpaque();
}

/* ══════════════ PRESELECCIÓN ══════════════ */

export async function createPreselectionAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const year = new Date().getFullYear();
  const lastPs = await prisma.preselectionSession.findFirst({
    where: { tenantId: session.tenantId, code: { startsWith: `LI-${year}-` } },
    orderBy: { code: 'desc' },
  });
  const seq = lastPs ? parseInt(lastPs.code.split('-')[2]) + 1 : 1;
  const code = `LI-${year}-${String(seq).padStart(3, '0')}`;

  // Parse output config
  const outputConfigJson = String(formData.get('outputConfig') || '[]');
  let outputConfig: { outputNumber: number; color?: string; caliber?: string; isDiscard: boolean; label?: string }[] = [];
  try { outputConfig = JSON.parse(outputConfigJson); } catch { /* ignore */ }

  const ps = await prisma.preselectionSession.create({
    data: {
      tenantId: session.tenantId,
      code,
      outputConfig: {
        create: outputConfig.map((oc) => ({
          outputNumber: oc.outputNumber,
          color: oc.color || null,
          caliber: oc.caliber || null,
          isDiscard: oc.isDiscard,
          label: oc.label || null,
        })),
      },
    },
  });

  revalidateEmpaque();
  return ps.id;
}

export async function addBinToPreselectionAction(preselectionId: string, binId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const ps = await prisma.preselectionSession.findFirst({
    where: { id: preselectionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Preselección no encontrada.');

  await prisma.$transaction([
    prisma.preselectionBin.create({
      data: { preselectionId, binId },
    }),
    prisma.packingBin.update({
      where: { id: binId },
      data: { status: 'IN_PRESELECTION' },
    }),
  ]);

  revalidateEmpaque();
}

export async function addWorkerToPreselectionAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const preselectionId = String(formData.get('preselectionId') || '').trim();
  const workerId = String(formData.get('workerId') || '').trim();
  const role = String(formData.get('role') || '').trim() || null;

  if (!preselectionId || !workerId) throw new Error('Datos incompletos.');

  const ps = await prisma.preselectionSession.findFirst({
    where: { id: preselectionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Preselección no encontrada.');

  await prisma.preselectionWorker.create({
    data: { preselectionId, workerId, role },
  });

  revalidateEmpaque();
}

export async function registerPreselectionInputAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const preselectionId = String(formData.get('preselectionId') || '').trim();
  const itemName = String(formData.get('itemName') || '').trim();
  const quantity = Number(formData.get('quantity') || 0);
  const unit = String(formData.get('unit') || '').trim();
  const cost = formData.get('cost') ? Number(formData.get('cost')) : null;

  if (!preselectionId || !itemName || quantity <= 0 || !unit) {
    throw new Error('Complete los campos del insumo.');
  }

  const ps = await prisma.preselectionSession.findFirst({
    where: { id: preselectionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Preselección no encontrada.');

  await prisma.preselectionInput.create({
    data: { preselectionId, itemName, quantity, unit, cost },
  });

  revalidateEmpaque();
}

export async function finalizePreselectionAction(preselectionId: string, discardKg: number) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const ps = await prisma.preselectionSession.findFirst({
    where: { id: preselectionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Preselección no encontrada.');

  const now = new Date();
  const durationMs = now.getTime() - ps.startTime.getTime();
  const durationHours = Math.round((durationMs / 3600000) * 100) / 100;

  await prisma.preselectionSession.update({
    where: { id: preselectionId },
    data: {
      status: 'COMPLETED',
      endTime: now,
      totalDurationHours: durationHours,
      discardKg,
    },
  });

  revalidateEmpaque();
}

export async function generatePreselectionOutputBinAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const preselectionId = String(formData.get('preselectionId') || '').trim();
  const fruitColor = String(formData.get('fruitColor') || '').trim();
  const fruitQuality = String(formData.get('fruitQuality') || '').trim();
  const netWeight = Number(formData.get('netWeight') || 0);
  const fruitType = String(formData.get('fruitType') || '').trim();
  const fieldName = String(formData.get('fieldName') || '').trim();
  const lotName = String(formData.get('lotName') || '').trim();

  if (!preselectionId || !fruitColor || !fruitQuality || netWeight <= 0) {
    throw new Error('Complete los datos del bin de salida.');
  }

  const ps = await prisma.preselectionSession.findFirst({
    where: { id: preselectionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Preselección no encontrada.');

  const year = new Date().getFullYear();
  const lastBin = await prisma.packingBin.findFirst({
    where: { tenantId: session.tenantId, code: { startsWith: `B-${year}-` } },
    orderBy: { code: 'desc' },
  });
  const seq = lastBin ? parseInt(lastBin.code.split('-')[2]) + 1 : 1;
  const code = `B-${year}-${String(seq).padStart(4, '0')}`;

  // Color 1,2 go directly to process, Color 3,4 go to chamber
  const needsChamber = fruitColor === 'Color 3' || fruitColor === 'Color 4';
  const status = needsChamber ? 'IN_YARD' : 'READY_FOR_PROCESS';

  await prisma.packingBin.create({
    data: {
      tenantId: session.tenantId,
      code,
      fieldName,
      fruitType,
      lotName,
      netWeight,
      isTrazable: true,
      status,
      preselectionId,
      internalLot: ps.code,
      fruitColor,
      fruitQuality,
    },
  });

  revalidateEmpaque();
}

/* ══════════════ CÁMARAS ══════════════ */

export async function createChamberAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const name = String(formData.get('name') || '').trim();
  const type = String(formData.get('type') || 'ETHYLENE') as 'ETHYLENE' | 'COLD';
  const capacity = Number(formData.get('capacity') || 30);
  const temperature = formData.get('temperature') ? Number(formData.get('temperature')) : null;
  const humidity = formData.get('humidity') ? Number(formData.get('humidity')) : null;

  if (!name) throw new Error('Nombre de cámara requerido.');

  await prisma.chamber.create({
    data: { tenantId: session.tenantId, name, type, capacity, temperature, humidity },
  });

  revalidateEmpaque();
}

export async function ingressBinToChamberAction(chamberId: string, binIds: string[]) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const chamber = await prisma.chamber.findFirst({
    where: { id: chamberId, tenantId: session.tenantId },
  });
  if (!chamber) throw new Error('Cámara no encontrada.');

  await prisma.packingBin.updateMany({
    where: { id: { in: binIds }, tenantId: session.tenantId },
    data: {
      chamberId,
      chamberEntryDate: new Date(),
      status: 'IN_CHAMBER',
    },
  });

  revalidateEmpaque();
}

export async function egressBinFromChamberAction(binId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const bin = await prisma.packingBin.findFirst({
    where: { id: binId, tenantId: session.tenantId, status: 'IN_CHAMBER' },
  });
  if (!bin) throw new Error('Bin no encontrado en cámara.');

  await prisma.packingBin.update({
    where: { id: binId },
    data: {
      chamberId: null,
      chamberExitDate: new Date(),
      status: 'READY_FOR_PROCESS',
    },
  });

  revalidateEmpaque();
}

export async function registerChamberTaskAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const chamberId = String(formData.get('chamberId') || '').trim();
  const type = String(formData.get('type') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const cost = formData.get('cost') ? Number(formData.get('cost')) : null;

  if (!chamberId || !type || !description) throw new Error('Complete los datos de la tarea.');

  // Verify chamber belongs to tenant
  const chamber = await prisma.chamber.findFirst({
    where: { id: chamberId, tenantId: session.tenantId },
  });
  if (!chamber) throw new Error('Cámara no encontrada.');

  await prisma.chamberTask.create({
    data: { chamberId, type, description, cost },
  });

  revalidateEmpaque();
}

export async function updateChamberSettingsAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const chamberId = String(formData.get('chamberId') || '').trim();
  const temperature = formData.get('temperature') ? Number(formData.get('temperature')) : null;
  const humidity = formData.get('humidity') ? Number(formData.get('humidity')) : null;

  const chamber = await prisma.chamber.findFirst({
    where: { id: chamberId, tenantId: session.tenantId },
  });
  if (!chamber) throw new Error('Cámara no encontrada.');

  await prisma.chamber.update({
    where: { id: chamberId },
    data: { temperature, humidity },
  });

  revalidateEmpaque();
}

/* ══════════════ PROCESO ══════════════ */

export async function createProcessSessionAction() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const year = new Date().getFullYear();
  const lastProc = await prisma.processSession.findFirst({
    where: { tenantId: session.tenantId, code: { startsWith: `proceso-` } },
    orderBy: { code: 'desc' },
  });
  const seq = lastProc ? parseInt(lastProc.code.split('-')[1]) + 1 : 1;
  const code = `proceso-${String(seq).padStart(3, '0')}`;

  const proc = await prisma.processSession.create({
    data: { tenantId: session.tenantId, code },
  });

  revalidateEmpaque();
  return proc.id;
}

export async function addBinToProcessAction(processSessionId: string, binId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const ps = await prisma.processSession.findFirst({
    where: { id: processSessionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Sesión de proceso no encontrada.');

  await prisma.$transaction([
    prisma.processBin.create({
      data: { processSessionId, binId },
    }),
    prisma.packingBin.update({
      where: { id: binId },
      data: { status: 'IN_PROCESS' },
    }),
  ]);

  revalidateEmpaque();
}

export async function registerProcessProductAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const processSessionId = String(formData.get('processSessionId') || '').trim();
  const productName = String(formData.get('productName') || '').trim();
  const quantity = Number(formData.get('quantity') || 0);
  const unit = String(formData.get('unit') || '').trim();
  const cost = formData.get('cost') ? Number(formData.get('cost')) : null;

  if (!processSessionId || !productName || quantity <= 0 || !unit) {
    throw new Error('Complete los datos del producto.');
  }

  await prisma.processProduct.create({
    data: { processSessionId, productName, quantity, unit, cost },
  });

  revalidateEmpaque();
}

export async function registerDiscardAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const processSessionId = String(formData.get('processSessionId') || '').trim();
  const cleanKg = Number(formData.get('cleanDiscardKg') || 0);
  const contaminatedKg = Number(formData.get('contaminatedDiscardKg') || 0);

  const ps = await prisma.processSession.findFirst({
    where: { id: processSessionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Sesión de proceso no encontrada.');

  await prisma.processSession.update({
    where: { id: processSessionId },
    data: {
      cleanDiscardKg: { increment: cleanKg },
      contaminatedDiscardKg: { increment: contaminatedKg },
    },
  });

  revalidateEmpaque();
}

export async function finalizeProcessSessionAction(processSessionId: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const ps = await prisma.processSession.findFirst({
    where: { id: processSessionId, tenantId: session.tenantId },
  });
  if (!ps) throw new Error('Sesión de proceso no encontrada.');

  const now = new Date();
  const durationMs = now.getTime() - ps.startTime.getTime();
  const durationHours = Math.round((durationMs / 3600000) * 100) / 100;

  await prisma.processSession.update({
    where: { id: processSessionId },
    data: {
      status: 'COMPLETED',
      endTime: now,
      totalDurationHours: durationHours,
    },
  });

  revalidateEmpaque();
}

/* ══════════════ CAJAS (BOXES) ══════════════ */

export async function createBoxAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const product = String(formData.get('product') || '').trim();
  const producer = String(formData.get('producer') || '').trim() || null;
  const caliber = String(formData.get('caliber') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const packagingCode = String(formData.get('packagingCode') || '').trim() || null;
  const destination = String(formData.get('destination') || 'MERCADO_INTERNO') as 'MERCADO_INTERNO' | 'EXPORTACION';
  const weightKg = Number(formData.get('weightKg') || 0);
  const processSessionId = String(formData.get('processSessionId') || '').trim() || null;

  if (!product || !caliber || !category || weightKg <= 0) {
    throw new Error('Complete los campos obligatorios de la caja.');
  }

  const year = new Date().getFullYear();
  const lastBox = await prisma.packingBox.findFirst({
    where: { tenantId: session.tenantId, code: { startsWith: `C-${year}-` } },
    orderBy: { code: 'desc' },
  });
  const seq = lastBox ? parseInt(lastBox.code.split('-')[2]) + 1 : 1;
  const code = `C-${year}-${String(seq).padStart(5, '0')}`;

  await prisma.packingBox.create({
    data: {
      tenantId: session.tenantId,
      code,
      product,
      producer,
      caliber,
      category,
      packagingCode,
      destination,
      weightKg,
      processSessionId,
    },
  });

  revalidateEmpaque();
}

/* ══════════════ PALLETS ══════════════ */

export async function createPalletAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const boxIdsJson = String(formData.get('boxIds') || '[]');
  const operatorName = String(formData.get('operatorName') || '').trim() || null;
  let boxIds: string[] = [];
  try { boxIds = JSON.parse(boxIdsJson); } catch { /* ignore */ }

  if (boxIds.length === 0) throw new Error('Seleccione al menos una caja.');

  const year = new Date().getFullYear();
  const lastPallet = await prisma.pallet.findFirst({
    where: { tenantId: session.tenantId, code: { startsWith: `P-${year}-` } },
    orderBy: { number: 'desc' },
  });
  const number = lastPallet ? lastPallet.number + 1 : 1;
  const code = `P-${year}-${String(number).padStart(4, '0')}`;

  await prisma.$transaction(async (tx) => {
    const pallet = await tx.pallet.create({
      data: { tenantId: session.tenantId, number, code, operatorName },
    });

    await tx.packingBox.updateMany({
      where: { id: { in: boxIds }, tenantId: session.tenantId },
      data: { palletId: pallet.id },
    });
  });

  revalidateEmpaque();
}

/* ══════════════ DESPACHO ══════════════ */

export async function createDispatchAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const clientName = String(formData.get('clientName') || '').trim();
  const clientType = String(formData.get('clientType') || '').trim() || null;
  const saleType = String(formData.get('saleType') || '').trim() || null;
  const deliveryAddress = String(formData.get('deliveryAddress') || '').trim() || null;
  const remitoNumber = String(formData.get('remitoNumber') || '').trim() || null;
  const dtv = String(formData.get('dtv') || '').trim() || null;
  const dtc = String(formData.get('dtc') || '').trim() || null;
  const closingCode = String(formData.get('closingCode') || '').trim() || null;
  const destination = String(formData.get('destination') || '').trim() || null;
  const discharge = String(formData.get('discharge') || '').trim() || null;
  const transport = String(formData.get('transport') || '').trim() || null;
  const driverName = String(formData.get('driverName') || '').trim() || null;
  const licensePlate = String(formData.get('licensePlate') || '').trim() || null;
  const departureDate = formData.get('departureDate') ? new Date(String(formData.get('departureDate'))) : null;
  const departureTime = String(formData.get('departureTime') || '').trim() || null;
  const observations = String(formData.get('observations') || '').trim() || null;
  const palletIdsJson = String(formData.get('palletIds') || '[]');
  const generateRemito = formData.get('generateRemito') === 'true';
  const generateDtv = formData.get('generateDtv') === 'true';
  const generateDtc = formData.get('generateDtc') === 'true';

  let palletIds: string[] = [];
  try { palletIds = JSON.parse(palletIdsJson); } catch { /* ignore */ }

  if (!clientName) throw new Error('El nombre del cliente es obligatorio.');

  const year = new Date().getFullYear();
  const lastDispatch = await prisma.dispatch.findFirst({
    where: { tenantId: session.tenantId, code: { startsWith: `D-${year}-` } },
    orderBy: { code: 'desc' },
  });
  const seq = lastDispatch ? parseInt(lastDispatch.code.split('-')[2]) + 1 : 1;
  const code = `D-${year}-${String(seq).padStart(4, '0')}`;

  await prisma.$transaction(async (tx) => {
    const dispatch = await tx.dispatch.create({
      data: {
        tenantId: session.tenantId,
        code,
        clientName,
        clientType,
        saleType,
        deliveryAddress,
        remitoNumber,
        dtv,
        dtc,
        closingCode,
        destination,
        discharge,
        transport,
        driverName,
        licensePlate,
        departureDate,
        departureTime,
        observations,
      },
    });

    if (palletIds.length > 0) {
      await tx.dispatchPallet.createMany({
        data: palletIds.map((palletId) => ({
          dispatchId: dispatch.id,
          palletId,
        })),
      });

      await tx.pallet.updateMany({
        where: { id: { in: palletIds } },
        data: { status: 'DISPATCHED' },
      });
    }
  });

  revalidateEmpaque();
}

export async function updateDispatchStatusAction(dispatchId: string, status: string) {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const dispatch = await prisma.dispatch.findFirst({
    where: { id: dispatchId, tenantId: session.tenantId },
  });
  if (!dispatch) throw new Error('Despacho no encontrado.');

  await prisma.dispatch.update({
    where: { id: dispatchId },
    data: { status: status as 'PREPARING' | 'LOADED' | 'IN_TRANSIT' | 'DELIVERED' },
  });

  revalidateEmpaque();
}
