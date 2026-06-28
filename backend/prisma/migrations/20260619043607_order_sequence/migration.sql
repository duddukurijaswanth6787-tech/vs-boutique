-- AlterTable
ALTER TABLE "commerce_orders" ADD COLUMN     "reservation_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "order_sequences" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "date" VARCHAR(10) NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_sequences_date_key" ON "order_sequences"("date");
