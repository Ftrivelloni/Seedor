-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "cuit" TEXT,
ADD COLUMN     "fiscalAddress" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "darkMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'es',
ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyWhatsApp" BOOLEAN NOT NULL DEFAULT false;
