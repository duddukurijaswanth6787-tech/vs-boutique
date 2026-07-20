-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "staff_department" ADD VALUE 'PACKING';
ALTER TYPE "staff_department" ADD VALUE 'INVENTORY';

-- AlterTable
ALTER TABLE "staff_profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "reportingManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
