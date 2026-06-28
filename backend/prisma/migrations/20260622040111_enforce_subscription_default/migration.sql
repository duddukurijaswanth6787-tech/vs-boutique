-- AlterTable
ALTER TABLE "boutiques" ALTER COLUMN "subscription_enforcement" SET DEFAULT true;

-- Backfill existing boutique records to enable enforcement
UPDATE "boutiques" SET "subscription_enforcement" = true WHERE "subscription_enforcement" = false;
