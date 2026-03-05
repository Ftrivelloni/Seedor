-- AlterTable: Add Mercado Pago card info fields to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpPreapprovalId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpPreapprovalPlanId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpPayerEmail" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpLastPaymentId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpLastEventAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpCardLastFour" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpCardBrand" TEXT;

-- CreateIndex: Add unique constraint to mpPreapprovalId
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_mpPreapprovalId_key" ON "Tenant"("mpPreapprovalId");
