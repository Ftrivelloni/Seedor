/* ═══════════════════════════════════════════════════════
   Empaque Module – Serialized Types for Client Components
   ═══════════════════════════════════════════════════════ */

// ── Balanza ──
export interface SerializedTruckEntry {
  id: string;
  remitoNumber: string;
  dtv: string;
  transport: string;
  chassis: string | null;
  trailer: string | null;
  driverName: string;
  driverDni: string;
  operatorId: string | null;
  producerUnit: string | null;
  fieldOrigin: string | null;
  entryDate: string;
  status: string;
  bins: SerializedBin[];
  totalWeight: number;
}

export interface SerializedBin {
  id: string;
  code: string;
  binIdentifier: string | null;
  fieldName: string;
  fruitType: string;
  lotName: string;
  contractor: string | null;
  harvestType: string | null;
  binType: string | null;
  emptyWeight: number | null;
  netWeight: number;
  isTrazable: boolean;
  status: string;
  truckEntryId: string | null;
  preselectionId: string | null;
  internalLot: string | null;
  fruitColor: string | null;
  fruitQuality: string | null;
  caliber: string | null;
  chamberId: string | null;
  chamberEntryDate: string | null;
  chamberExitDate: string | null;
  createdAt: string;
}

// ── Preselección ──
export interface SerializedPreselection {
  id: string;
  code: string;
  status: string;
  startTime: string;
  endTime: string | null;
  pausedAt: string | null;
  totalDurationHours: number | null;
  pauseCount: number;
  totalPauseHours: number | null;
  discardKg: number;
  notes: string | null;
  inputBinCount: number;
  outputBinCount: number;
  totalInputKg: number;
  totalOutputKg: number;
  workers: SerializedPreselectionWorker[];
  outputConfig: SerializedOutputConfig[];
  outputBins: SerializedBin[];
}

export interface SerializedPreselectionWorker {
  id: string;
  workerId: string;
  workerName: string;
  role: string | null;
  hoursWorked: number | null;
}

export interface SerializedOutputConfig {
  id: string;
  outputNumber: number;
  color: string | null;
  caliber: string | null;
  isDiscard: boolean;
  label: string | null;
}

// ── Cámaras ──
export interface SerializedChamber {
  id: string;
  name: string;
  binsCount: number;
  bins: SerializedBin[];
  tasks: SerializedChamberTask[];
  totalKg: number;
}

export interface SerializedChamberTask {
  id: string;
  type: string;
  description: string;
  cost: number | null;
  date: string;
}

// ── Proceso ──
export interface SerializedProcessSession {
  id: string;
  code: string;
  status: string;
  startTime: string;
  endTime: string | null;
  pausedAt: string | null;
  totalDurationHours: number | null;
  pauseCount: number;
  totalPauseHours: number | null;
  cleanDiscardKg: number;
  contaminatedDiscardKg: number;
  notes: string | null;
  inputBinCount: number;
  boxCount: number;
  products: SerializedProcessProduct[];
}

export interface SerializedProcessProduct {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  cost: number | null;
}

// ── Cajas y Pallets ──
export interface SerializedBox {
  id: string;
  code: string;
  product: string;
  producer: string | null;
  caliber: string;
  category: string;
  packagingCode: string | null;
  weightKg: number;
  palletId: string | null;
  palletCode: string | null;
  createdAt: string;
}

export interface SerializedPallet {
  id: string;
  number: number;
  code: string;
  status: string;
  destination: string | null;
  operatorName: string | null;
  createdAt: string;
  boxCount: number;
  totalWeight: number;
  boxes: SerializedBox[];
}

// ── Despacho ──
export interface SerializedDispatch {
  id: string;
  code: string;
  clientName: string;
  clientType: string | null;
  saleType: string | null;
  deliveryAddress: string | null;
  remitoNumber: string | null;
  dtv: string | null;
  dtc: string | null;
  closingCode: string | null;
  destination: string | null;
  discharge: string | null;
  transport: string | null;
  driverName: string | null;
  licensePlate: string | null;
  departureDate: string | null;
  departureTime: string | null;
  status: string;
  observations: string | null;
  createdAt: string;
  palletCount: number;
  boxCount: number;
  pallets: SerializedDispatchPallet[];
}

export interface SerializedDispatchPallet {
  palletId: string;
  palletCode: string;
  boxCount: number;
  totalWeight: number;
}

// ── Workers (shared) ──
export interface SerializedWorkerOption {
  id: string;
  firstName: string;
  lastName: string;
  functionType: string;
}

// ── Empaque Dashboard KPIs ──
export interface EmpaqueDashboardData {
  binesEnPlaya: number;
  kgProcesadosHoy: number;
  cajasProducidasHoy: number;
  eficienciaLinea: number;
  flujo: {
    balanza: number;
    preseleccion: number;
    camaras: number;
    proceso: number;
    pallets: number;
    despacho: number;
  };
  chambers: SerializedChamber[];
  activePreselection: SerializedPreselection | null;
  activeProcess: SerializedProcessSession | null;
}

// ── Status labels & colors ──
export const truckEntryStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  FINALIZED: 'Finalizado',
};

export const truckEntryStatusColors: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700',
  FINALIZED: 'bg-green-100 text-green-700',
};

export const binStatusLabels: Record<string, string> = {
  IN_YARD: 'En Playa',
  IN_PRESELECTION: 'En Preselección',
  IN_CHAMBER: 'En Cámara',
  READY_FOR_PROCESS: 'Listo para Proceso',
  IN_PROCESS: 'En Proceso',
  PROCESSED: 'Procesado',
  DISCARDED: 'Descartado',
};

export const preselectionStatusLabels: Record<string, string> = {
  IN_PROGRESS: 'En curso',
  PAUSED: 'Pausada',
  COMPLETED: 'Completa',
};

export const preselectionStatusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export const processStatusLabels: Record<string, string> = {
  IN_PROGRESS: 'En curso',
  PAUSED: 'Pausada',
  COMPLETED: 'Completa',
};

export const dispatchStatusLabels: Record<string, string> = {
  PREPARING: 'Preparando',
  LOADED: 'Cargado',
  IN_TRANSIT: 'En Tránsito',
  DELIVERED: 'Entregado',
};

export const dispatchStatusColors: Record<string, string> = {
  PREPARING: 'bg-orange-100 text-orange-700',
  LOADED: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
};

// ── Config Options ──
export interface ConfigOption {
  id: string;
  name: string;
}

export interface FieldLotOption {
  fieldId: string;
  fieldName: string;
  lotId: string;
  lotName: string;
  label: string;
}
