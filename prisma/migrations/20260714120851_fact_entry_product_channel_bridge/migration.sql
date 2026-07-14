-- AlterTable
ALTER TABLE "fin_fact_entries" ADD COLUMN     "bridge_code" VARCHAR(30),
ADD COLUMN     "channel_code" VARCHAR(30),
ADD COLUMN     "label" VARCHAR(120),
ADD COLUMN     "product_code" VARCHAR(30);
