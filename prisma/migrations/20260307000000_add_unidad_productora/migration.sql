-- AlterTable: Add unidadProductora to Field (nullable so existing rows are not affected)
ALTER TABLE "Field" ADD COLUMN "unidadProductora" TEXT;

-- Add unique constraint for unidadProductora per tenant (NULLs are not considered equal, so multiple NULLs are allowed)
CREATE UNIQUE INDEX "Field_tenantId_unidadProductora_key" ON "Field"("tenantId", "unidadProductora");

-- AlterTable: Add unidadProductora to PackingBin (optional)
ALTER TABLE "PackingBin" ADD COLUMN "unidadProductora" TEXT;

-- AlterTable: Add trackUnidadProductora and unidadProductora to PreselectionSession
ALTER TABLE "PreselectionSession" ADD COLUMN "trackUnidadProductora" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PreselectionSession" ADD COLUMN "unidadProductora" TEXT;
