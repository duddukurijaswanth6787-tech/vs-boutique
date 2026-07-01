-- AlterTable: add reference columns for CMS engine integration
ALTER TABLE "cms_prompts" ADD COLUMN "reference_id" UUID,
ADD COLUMN "reference_type" VARCHAR(50);

-- CreateIndex
CREATE INDEX "cms_prompts_reference_type_reference_id_idx" ON "cms_prompts"("reference_type", "reference_id");
