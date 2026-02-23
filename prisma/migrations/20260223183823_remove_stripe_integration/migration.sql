-- DropTable
DROP TABLE IF EXISTS "StripeEvent";

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "stripeCustomerId",
DROP COLUMN IF EXISTS "stripeSubscriptionId";

-- AlterTable
ALTER TABLE "TenantModuleSetting" DROP COLUMN IF EXISTS "stripePriceId",
DROP COLUMN IF EXISTS "stripeSubscriptionItemId";
