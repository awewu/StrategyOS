-- CreateEnum
CREATE TYPE "SwotQuadrant" AS ENUM ('strength', 'weakness', 'opportunity', 'threat');

-- AlterTable
ALTER TABLE "plan_initiatives" ADD COLUMN     "okr_baseline" VARCHAR(100),
ADD COLUMN     "okr_key_result" VARCHAR(300),
ADD COLUMN     "okr_target" VARCHAR(100);

-- CreateTable
CREATE TABLE "plan_swot_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "quadrant" "SwotQuadrant" NOT NULL,
    "content" VARCHAR(400) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_swot_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_org_chart_nodes" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(100),
    "headcount" INTEGER,
    "headcount_new" INTEGER,
    "note" VARCHAR(300),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_org_chart_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_channel_plans" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "channel_type" VARCHAR(80) NOT NULL,
    "current_state" VARCHAR(400),
    "target_state" VARCHAR(400),
    "q1_action" VARCHAR(200),
    "q2_action" VARCHAR(200),
    "q3_action" VARCHAR(200),
    "q4_action" VARCHAR(200),
    "revenue_target" DECIMAL(14,2),
    "partner_count" INTEGER,
    "note" VARCHAR(400),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_channel_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_customer_plans" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "customer_segment" VARCHAR(100) NOT NULL,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "current_count" INTEGER,
    "target_count" INTEGER,
    "q1_count" INTEGER,
    "q2_count" INTEGER,
    "q3_count" INTEGER,
    "q4_count" INTEGER,
    "revenue_per_customer" DECIMAL(14,2),
    "acquisition_strategy" VARCHAR(400),
    "retention_strategy" VARCHAR(400),
    "note" VARCHAR(400),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_customer_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_product_quarterly" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "product_name" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20),
    "q1_qty" DECIMAL(14,2),
    "q1_revenue" DECIMAL(14,2),
    "q2_qty" DECIMAL(14,2),
    "q2_revenue" DECIMAL(14,2),
    "q3_qty" DECIMAL(14,2),
    "q3_revenue" DECIMAL(14,2),
    "q4_qty" DECIMAL(14,2),
    "q4_revenue" DECIMAL(14,2),
    "annual_qty" DECIMAL(14,2),
    "annual_revenue" DECIMAL(14,2),
    "note" VARCHAR(300),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_product_quarterly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_swot_items_plan_id_quadrant_idx" ON "plan_swot_items"("plan_id", "quadrant");

-- CreateIndex
CREATE INDEX "plan_org_chart_nodes_plan_id_idx" ON "plan_org_chart_nodes"("plan_id");

-- CreateIndex
CREATE INDEX "plan_channel_plans_plan_id_idx" ON "plan_channel_plans"("plan_id");

-- CreateIndex
CREATE INDEX "plan_customer_plans_plan_id_idx" ON "plan_customer_plans"("plan_id");

-- CreateIndex
CREATE INDEX "plan_product_quarterly_plan_id_idx" ON "plan_product_quarterly"("plan_id");

-- AddForeignKey
ALTER TABLE "plan_swot_items" ADD CONSTRAINT "plan_swot_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_org_chart_nodes" ADD CONSTRAINT "plan_org_chart_nodes_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_channel_plans" ADD CONSTRAINT "plan_channel_plans_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_customer_plans" ADD CONSTRAINT "plan_customer_plans_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_product_quarterly" ADD CONSTRAINT "plan_product_quarterly_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
