-- AlterTable: Remove Stripe fields from Tenant
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "stripeSubscriptionId";

-- AlterTable: Remove Stripe fields from TenantModuleSetting
ALTER TABLE "TenantModuleSetting" DROP COLUMN IF EXISTS "stripePriceId";
ALTER TABLE "TenantModuleSetting" DROP COLUMN IF EXISTS "stripeSubscriptionItemId";

-- DropTable: Remove StripeEvent model
DROP TABLE IF EXISTS "StripeEvent";
