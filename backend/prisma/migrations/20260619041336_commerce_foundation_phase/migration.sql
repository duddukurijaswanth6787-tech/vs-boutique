-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CommerceOrderStatus" ADD VALUE 'PACKED';
ALTER TYPE "CommerceOrderStatus" ADD VALUE 'OUT_FOR_DELIVERY';
ALTER TYPE "CommerceOrderStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "commerce_order_items" ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_rate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "commerce_orders" ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
ADD COLUMN     "net_amount" DECIMAL(12,2),
ADD COLUMN     "out_for_delivery_at" TIMESTAMP(3),
ADD COLUMN     "packed_at" TIMESTAMP(3),
ADD COLUMN     "payment_details" JSONB,
ADD COLUMN     "payment_method" VARCHAR(50),
ADD COLUMN     "refund_amount" DECIMAL(12,2),
ADD COLUMN     "refunded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_inventory" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "commerce_order_histories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL,
    "from_status" VARCHAR(50),
    "to_status" VARCHAR(50) NOT NULL,
    "note" TEXT,
    "changed_by" VARCHAR(50),
    "changed_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commerce_order_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "commerce_order_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "razorpay_order_id" VARCHAR(100),
    "razorpay_payment_id" VARCHAR(100),
    "razorpay_signature" VARCHAR(255),
    "refund_id" VARCHAR(100),
    "refund_amount" DECIMAL(12,2),
    "refund_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commerce_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commerce_order_histories_order_id_created_at_idx" ON "commerce_order_histories"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "commerce_payments_commerce_order_id_idx" ON "commerce_payments"("commerce_order_id");

-- CreateIndex
CREATE INDEX "commerce_payments_razorpay_order_id_idx" ON "commerce_payments"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "commerce_order_items_product_id_idx" ON "commerce_order_items"("product_id");

-- CreateIndex
CREATE INDEX "commerce_order_items_variant_id_idx" ON "commerce_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "commerce_orders_created_at_idx" ON "commerce_orders"("created_at");

-- CreateIndex
CREATE INDEX "commerce_orders_payment_status_idx" ON "commerce_orders"("payment_status");

-- CreateIndex
CREATE INDEX "commerce_orders_boutique_id_created_at_idx" ON "commerce_orders"("boutique_id", "created_at");

-- CreateIndex
CREATE INDEX "commerce_orders_user_id_created_at_idx" ON "commerce_orders"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "commerce_order_histories" ADD CONSTRAINT "commerce_order_histories_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payments" ADD CONSTRAINT "commerce_payments_commerce_order_id_fkey" FOREIGN KEY ("commerce_order_id") REFERENCES "commerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
