-- AlterTable
ALTER TABLE "payments" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "payments" ADD COLUMN "verified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'VAT',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "applies_to_item_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
