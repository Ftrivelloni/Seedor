/* ── Serialized types for client components ── */

export interface SerializedStock {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  itemUnit: string;
  quantity: number;
  lowThreshold: number;
  criticalThreshold: number;
  alertLevel: string; // OK | BAJO | CRITICO | SIN_STOCK
}

export interface SerializedWarehouse {
  id: string;
  name: string;
  description: string | null;
  stocks: SerializedStock[];
}

export interface SerializedItemStock {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  lowThreshold: number;
  criticalThreshold: number;
}

export interface SerializedItem {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  createdAt: string;
  stocks: SerializedItemStock[];
}

export interface SerializedMovement {
  id: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  itemCode: string;
  itemName: string;
  itemUnit: string;
  sourceWarehouseName: string | null;
  destinationWarehouseName: string | null;
  createdByName: string | null;
}

export interface SerializedExtraordinaryRequest {
  id: string;
  name: string;
  description: string;
  status: string;
  requestedAt: string;
  deliveredAt: string | null;
  requestedByName: string;
}

export interface SerializedAlert {
  stockId: string;
  warehouseName: string;
  itemCode: string;
  itemName: string;
  itemUnit: string;
  quantity: number;
  lowThreshold: number;
  criticalThreshold: number;
  level: string;
}
