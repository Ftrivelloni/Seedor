/* ── Serialized types for Campo client components ── */

export interface SerializedLot {
  id: string;
  fieldId: string;
  name: string;
  areaHectares: number;
  productionType: string;
  plantedFruitsDescription: string | null;
  lastTaskAt: string | null;
  taskCost: number;
  totalHarvestKilos: number;
  taskCount: number;
  /** Map of taskType name → ISO date of last task of that type */
  taskRecency: Record<string, string>;
}

export interface SerializedField {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  lots: SerializedLot[];
}

export interface SerializedWorker {
  id: string;
  firstName: string;
  lastName: string;
  functionType: string;
}

export interface SerializedTask {
  id: string;
  description: string;
  taskType: string;
  status: string;
  costValue: number | null;
  costUnit: string | null;
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  isComposite: boolean;
  subtaskProgress: number;
  parentTaskId: string | null;
  lots: string[];
  workers: string[];
  createdAt: string;
}

export interface SerializedHarvest {
  id: string;
  lotId: string;
  lotName: string;
  fieldName: string;
  cropType: string;
  kilos: number;
  harvestDate: string;
}

export interface SerializedInventoryItem {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export interface SerializedWarehouse {
  id: string;
  name: string;
}

export interface SerializedTaskType {
  id: string;
  name: string;
  color: string;
}

export type LotViewMode = 'grid-large' | 'grid-medium' | 'list';

export const taskStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  LATE: 'Atrasada',
};

export const taskStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  LATE: 'bg-red-100 text-red-800 border-red-200',
};
