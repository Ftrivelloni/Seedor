-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkerPaymentType" AS ENUM ('HOURLY', 'PER_TASK', 'FIXED_SALARY');

-- CreateEnum
CREATE TYPE "WorkerPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'LATE');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INCOME', 'TRANSFER', 'CONSUMPTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ExtraordinaryItemStatus" AS ENUM ('PENDING', 'DELIVERED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ModuleKey" AS ENUM ('DASHBOARD', 'USERS', 'WORKERS', 'FIELD', 'INVENTORY', 'MACHINERY', 'PACKAGING', 'SALES', 'SETTINGS');

-- CreateEnum
CREATE TYPE "BinStatus" AS ENUM ('IN_YARD', 'IN_PRESELECTION', 'IN_CHAMBER', 'READY_FOR_PROCESS', 'IN_PROCESS', 'PROCESSED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "PreselectionStatus" AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProcessSessionStatus" AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ChamberType" AS ENUM ('ETHYLENE', 'COLD');

-- CreateEnum
CREATE TYPE "BoxDestination" AS ENUM ('MERCADO_INTERNO', 'EXPORTACION');

-- CreateEnum
CREATE TYPE "PalletStatus" AS ENUM ('ON_FLOOR', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PREPARING', 'LOADED', 'IN_TRANSIT', 'DELIVERED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "planInterval" "PlanInterval" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SUPERVISOR',
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "lastAccessAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUserMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUserMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION NOT NULL,
    "productionType" TEXT NOT NULL,
    "plantedFruitsDescription" TEXT,
    "lastTaskAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "parentTaskId" TEXT,
    "description" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "costValue" DOUBLE PRECISION,
    "costUnit" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "isComposite" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLot" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#16a34a',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotCrop" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "cropTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotCrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "paymentType" "WorkerPaymentType" NOT NULL,
    "functionType" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "taskRate" DOUBLE PRECISION,
    "fixedSalary" DOUBLE PRECISION,
    "paymentStatus" "WorkerPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskWorkLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "hoursWorked" DOUBLE PRECISION,
    "paymentAmount" DOUBLE PRECISION,
    "paymentStatus" "WorkerPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskWorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "kilos" DOUBLE PRECISION NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HarvestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseStock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lowThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criticalThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "sourceWarehouseId" TEXT,
    "destinationWarehouseId" TEXT,
    "referenceTaskId" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskInventoryUsage" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "movementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskInventoryUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraordinaryItemRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ExtraordinaryItemStatus" NOT NULL DEFAULT 'PENDING',
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraordinaryItemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardPreference" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL DEFAULT 'balanced',
    "widgetsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantModuleSetting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "module" "ModuleKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "stripePriceId" TEXT,
    "stripeSubscriptionItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantModuleSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingTruckEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "remitoNumber" TEXT NOT NULL,
    "dtv" TEXT NOT NULL,
    "transport" TEXT NOT NULL,
    "chassis" TEXT,
    "trailer" TEXT,
    "driverName" TEXT NOT NULL,
    "driverDni" TEXT NOT NULL,
    "operatorId" TEXT,
    "producerUnit" TEXT,
    "fieldOrigin" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingTruckEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingBin" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "binIdentifier" TEXT,
    "fieldName" TEXT NOT NULL,
    "fruitType" TEXT NOT NULL,
    "lotName" TEXT NOT NULL,
    "contractor" TEXT,
    "harvestType" TEXT,
    "binType" TEXT,
    "emptyWeight" DOUBLE PRECISION,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "isTrazable" BOOLEAN NOT NULL DEFAULT true,
    "status" "BinStatus" NOT NULL DEFAULT 'IN_YARD',
    "truckEntryId" TEXT,
    "preselectionId" TEXT,
    "internalLot" TEXT,
    "fruitColor" TEXT,
    "fruitQuality" TEXT,
    "caliber" TEXT,
    "chamberId" TEXT,
    "chamberEntryDate" TIMESTAMP(3),
    "chamberExitDate" TIMESTAMP(3),
    "parentBinId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingBin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreselectionSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "PreselectionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "totalDurationHours" DOUBLE PRECISION,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "totalPauseHours" DOUBLE PRECISION DEFAULT 0,
    "discardKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreselectionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreselectionBin" (
    "id" TEXT NOT NULL,
    "preselectionId" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreselectionBin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreselectionOutputConfig" (
    "id" TEXT NOT NULL,
    "preselectionId" TEXT NOT NULL,
    "outputNumber" INTEGER NOT NULL,
    "color" TEXT,
    "caliber" TEXT,
    "isDiscard" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,

    CONSTRAINT "PreselectionOutputConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreselectionWorker" (
    "id" TEXT NOT NULL,
    "preselectionId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "role" TEXT,
    "hoursWorked" DOUBLE PRECISION,

    CONSTRAINT "PreselectionWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreselectionInput" (
    "id" TEXT NOT NULL,
    "preselectionId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,

    CONSTRAINT "PreselectionInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamber" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChamberType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chamber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChamberTask" (
    "id" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChamberTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ProcessSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "totalDurationHours" DOUBLE PRECISION,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "totalPauseHours" DOUBLE PRECISION DEFAULT 0,
    "cleanDiscardKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contaminatedDiscardKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessBin" (
    "id" TEXT NOT NULL,
    "processSessionId" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessBin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessProduct" (
    "id" TEXT NOT NULL,
    "processSessionId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,

    CONSTRAINT "ProcessProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingBox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "producer" TEXT,
    "caliber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "packagingCode" TEXT,
    "destination" "BoxDestination" NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "processSessionId" TEXT,
    "palletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pallet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" "PalletStatus" NOT NULL DEFAULT 'ON_FLOOR',
    "operatorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientType" TEXT,
    "saleType" TEXT,
    "deliveryAddress" TEXT,
    "remitoNumber" TEXT,
    "dtv" TEXT,
    "dtc" TEXT,
    "closingCode" TEXT,
    "destination" TEXT,
    "discharge" TEXT,
    "transport" TEXT,
    "driverName" TEXT,
    "licensePlate" TEXT,
    "departureDate" TIMESTAMP(3),
    "departureTime" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PREPARING',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchPallet" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "palletId" TEXT NOT NULL,

    CONSTRAINT "DispatchPallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeSubscriptionId_key" ON "Tenant"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUserMembership_userId_key" ON "TenantUserMembership"("userId");

-- CreateIndex
CREATE INDEX "TenantUserMembership_tenantId_idx" ON "TenantUserMembership"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUserMembership_tenantId_userId_key" ON "TenantUserMembership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Field_tenantId_idx" ON "Field"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Field_tenantId_name_key" ON "Field"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Lot_tenantId_idx" ON "Lot"("tenantId");

-- CreateIndex
CREATE INDEX "Lot_fieldId_idx" ON "Lot"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_fieldId_name_key" ON "Lot"("fieldId", "name");

-- CreateIndex
CREATE INDEX "Task_tenantId_status_idx" ON "Task"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "TaskLot_lotId_idx" ON "TaskLot"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskLot_taskId_lotId_key" ON "TaskLot"("taskId", "lotId");

-- CreateIndex
CREATE INDEX "TaskType_tenantId_idx" ON "TaskType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskType_tenantId_name_key" ON "TaskType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CropType_tenantId_idx" ON "CropType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CropType_tenantId_name_key" ON "CropType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "LotCrop_lotId_idx" ON "LotCrop"("lotId");

-- CreateIndex
CREATE INDEX "LotCrop_cropTypeId_idx" ON "LotCrop"("cropTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "LotCrop_lotId_cropTypeId_key" ON "LotCrop"("lotId", "cropTypeId");

-- CreateIndex
CREATE INDEX "Worker_tenantId_idx" ON "Worker"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_tenantId_dni_key" ON "Worker"("tenantId", "dni");

-- CreateIndex
CREATE INDEX "TaskAssignment_workerId_idx" ON "TaskAssignment"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_workerId_key" ON "TaskAssignment"("taskId", "workerId");

-- CreateIndex
CREATE INDEX "TaskWorkLog_taskId_idx" ON "TaskWorkLog"("taskId");

-- CreateIndex
CREATE INDEX "TaskWorkLog_workerId_idx" ON "TaskWorkLog"("workerId");

-- CreateIndex
CREATE INDEX "HarvestRecord_tenantId_harvestDate_idx" ON "HarvestRecord"("tenantId", "harvestDate");

-- CreateIndex
CREATE INDEX "HarvestRecord_lotId_idx" ON "HarvestRecord"("lotId");

-- CreateIndex
CREATE INDEX "Warehouse_tenantId_idx" ON "Warehouse"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_tenantId_name_key" ON "Warehouse"("tenantId", "name");

-- CreateIndex
CREATE INDEX "InventoryItem_tenantId_name_idx" ON "InventoryItem"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_tenantId_code_key" ON "InventoryItem"("tenantId", "code");

-- CreateIndex
CREATE INDEX "WarehouseStock_itemId_idx" ON "WarehouseStock"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStock_warehouseId_itemId_key" ON "WarehouseStock"("warehouseId", "itemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_tenantId_createdAt_idx" ON "InventoryMovement"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_itemId_idx" ON "InventoryMovement"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskInventoryUsage_movementId_key" ON "TaskInventoryUsage"("movementId");

-- CreateIndex
CREATE INDEX "TaskInventoryUsage_taskId_idx" ON "TaskInventoryUsage"("taskId");

-- CreateIndex
CREATE INDEX "TaskInventoryUsage_warehouseId_idx" ON "TaskInventoryUsage"("warehouseId");

-- CreateIndex
CREATE INDEX "ExtraordinaryItemRequest_tenantId_status_idx" ON "ExtraordinaryItemRequest"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardPreference_tenantId_userId_key" ON "DashboardPreference"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantModuleSetting_tenantId_module_key" ON "TenantModuleSetting"("tenantId", "module");

-- CreateIndex
CREATE INDEX "StripeEvent_type_idx" ON "StripeEvent"("type");

-- CreateIndex
CREATE INDEX "PackingTruckEntry_tenantId_entryDate_idx" ON "PackingTruckEntry"("tenantId", "entryDate");

-- CreateIndex
CREATE INDEX "PackingBin_tenantId_status_idx" ON "PackingBin"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PackingBin_tenantId_code_key" ON "PackingBin"("tenantId", "code");

-- CreateIndex
CREATE INDEX "PreselectionSession_tenantId_startTime_idx" ON "PreselectionSession"("tenantId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "PreselectionSession_tenantId_code_key" ON "PreselectionSession"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PreselectionBin_preselectionId_binId_key" ON "PreselectionBin"("preselectionId", "binId");

-- CreateIndex
CREATE UNIQUE INDEX "PreselectionOutputConfig_preselectionId_outputNumber_key" ON "PreselectionOutputConfig"("preselectionId", "outputNumber");

-- CreateIndex
CREATE INDEX "PreselectionWorker_preselectionId_idx" ON "PreselectionWorker"("preselectionId");

-- CreateIndex
CREATE INDEX "PreselectionInput_preselectionId_idx" ON "PreselectionInput"("preselectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Chamber_tenantId_name_key" ON "Chamber"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ChamberTask_chamberId_date_idx" ON "ChamberTask"("chamberId", "date");

-- CreateIndex
CREATE INDEX "ProcessSession_tenantId_startTime_idx" ON "ProcessSession"("tenantId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessSession_tenantId_code_key" ON "ProcessSession"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessBin_processSessionId_binId_key" ON "ProcessBin"("processSessionId", "binId");

-- CreateIndex
CREATE INDEX "ProcessProduct_processSessionId_idx" ON "ProcessProduct"("processSessionId");

-- CreateIndex
CREATE INDEX "PackingBox_tenantId_palletId_idx" ON "PackingBox"("tenantId", "palletId");

-- CreateIndex
CREATE UNIQUE INDEX "PackingBox_tenantId_code_key" ON "PackingBox"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Pallet_tenantId_status_idx" ON "Pallet"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Pallet_tenantId_code_key" ON "Pallet"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Dispatch_tenantId_status_idx" ON "Dispatch"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_tenantId_code_key" ON "Dispatch"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchPallet_dispatchId_palletId_key" ON "DispatchPallet"("dispatchId", "palletId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUserMembership" ADD CONSTRAINT "TenantUserMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUserMembership" ADD CONSTRAINT "TenantUserMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLot" ADD CONSTRAINT "TaskLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLot" ADD CONSTRAINT "TaskLot_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskType" ADD CONSTRAINT "TaskType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropType" ADD CONSTRAINT "CropType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotCrop" ADD CONSTRAINT "LotCrop_cropTypeId_fkey" FOREIGN KEY ("cropTypeId") REFERENCES "CropType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotCrop" ADD CONSTRAINT "LotCrop_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWorkLog" ADD CONSTRAINT "TaskWorkLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWorkLog" ADD CONSTRAINT "TaskWorkLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestRecord" ADD CONSTRAINT "HarvestRecord_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestRecord" ADD CONSTRAINT "HarvestRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_referenceTaskId_fkey" FOREIGN KEY ("referenceTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInventoryUsage" ADD CONSTRAINT "TaskInventoryUsage_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInventoryUsage" ADD CONSTRAINT "TaskInventoryUsage_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "InventoryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInventoryUsage" ADD CONSTRAINT "TaskInventoryUsage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInventoryUsage" ADD CONSTRAINT "TaskInventoryUsage_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryItemRequest" ADD CONSTRAINT "ExtraordinaryItemRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryItemRequest" ADD CONSTRAINT "ExtraordinaryItemRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardPreference" ADD CONSTRAINT "DashboardPreference_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardPreference" ADD CONSTRAINT "DashboardPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantModuleSetting" ADD CONSTRAINT "TenantModuleSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingTruckEntry" ADD CONSTRAINT "PackingTruckEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBin" ADD CONSTRAINT "PackingBin_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBin" ADD CONSTRAINT "PackingBin_truckEntryId_fkey" FOREIGN KEY ("truckEntryId") REFERENCES "PackingTruckEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBin" ADD CONSTRAINT "PackingBin_preselectionId_fkey" FOREIGN KEY ("preselectionId") REFERENCES "PreselectionSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBin" ADD CONSTRAINT "PackingBin_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBin" ADD CONSTRAINT "PackingBin_parentBinId_fkey" FOREIGN KEY ("parentBinId") REFERENCES "PackingBin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreselectionSession" ADD CONSTRAINT "PreselectionSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreselectionBin" ADD CONSTRAINT "PreselectionBin_preselectionId_fkey" FOREIGN KEY ("preselectionId") REFERENCES "PreselectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreselectionBin" ADD CONSTRAINT "PreselectionBin_binId_fkey" FOREIGN KEY ("binId") REFERENCES "PackingBin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreselectionOutputConfig" ADD CONSTRAINT "PreselectionOutputConfig_preselectionId_fkey" FOREIGN KEY ("preselectionId") REFERENCES "PreselectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreselectionWorker" ADD CONSTRAINT "PreselectionWorker_preselectionId_fkey" FOREIGN KEY ("preselectionId") REFERENCES "PreselectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreselectionWorker" ADD CONSTRAINT "PreselectionWorker_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreselectionInput" ADD CONSTRAINT "PreselectionInput_preselectionId_fkey" FOREIGN KEY ("preselectionId") REFERENCES "PreselectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamber" ADD CONSTRAINT "Chamber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamberTask" ADD CONSTRAINT "ChamberTask_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessSession" ADD CONSTRAINT "ProcessSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessBin" ADD CONSTRAINT "ProcessBin_processSessionId_fkey" FOREIGN KEY ("processSessionId") REFERENCES "ProcessSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessBin" ADD CONSTRAINT "ProcessBin_binId_fkey" FOREIGN KEY ("binId") REFERENCES "PackingBin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessProduct" ADD CONSTRAINT "ProcessProduct_processSessionId_fkey" FOREIGN KEY ("processSessionId") REFERENCES "ProcessSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBox" ADD CONSTRAINT "PackingBox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBox" ADD CONSTRAINT "PackingBox_processSessionId_fkey" FOREIGN KEY ("processSessionId") REFERENCES "ProcessSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingBox" ADD CONSTRAINT "PackingBox_palletId_fkey" FOREIGN KEY ("palletId") REFERENCES "Pallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pallet" ADD CONSTRAINT "Pallet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchPallet" ADD CONSTRAINT "DispatchPallet_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchPallet" ADD CONSTRAINT "DispatchPallet_palletId_fkey" FOREIGN KEY ("palletId") REFERENCES "Pallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

