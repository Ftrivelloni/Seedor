-- AlterEnum: Remove INACTIVE, TRIALING, CANCELED, and UNPAID from SubscriptionStatus
-- Step 1: Update all existing records to use only ACTIVE or PAST_DUE

-- Convert TRIALING and INACTIVE to ACTIVE (since they represent valid subscriptions)
UPDATE "Tenant" 
SET "subscriptionStatus" = 'ACTIVE' 
WHERE "subscriptionStatus" IN ('TRIALING', 'INACTIVE');

-- Convert CANCELED and UNPAID to PAST_DUE (transition state before deletion)
UPDATE "Tenant" 
SET "subscriptionStatus" = 'PAST_DUE' 
WHERE "subscriptionStatus" IN ('CANCELED', 'UNPAID');

-- Step 2: Drop default BEFORE changing the type (required for cast)
ALTER TABLE "Tenant" ALTER COLUMN "subscriptionStatus" DROP DEFAULT;

-- Step 3: Drop and recreate the enum with only ACTIVE and PAST_DUE
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";

CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE');

ALTER TABLE "Tenant" 
  ALTER COLUMN "subscriptionStatus" TYPE "SubscriptionStatus" 
  USING "subscriptionStatus"::text::"SubscriptionStatus";

DROP TYPE "SubscriptionStatus_old";

-- Step 4: Set new default
ALTER TABLE "Tenant" 
  ALTER COLUMN "subscriptionStatus" SET DEFAULT 'ACTIVE'::"SubscriptionStatus";
