-- CreateEnum
CREATE TYPE "FinBudgetStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- AlterEnum
ALTER TYPE "FinSourceType" ADD VALUE 'pvi_sales';

-- CreateTable
CREATE TABLE "pvi_sales_facts" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "business_unit" VARCHAR(60) NOT NULL,
    "reporting_unit" VARCHAR(80) NOT NULL,
    "product_name" VARCHAR(120) NOT NULL,
    "channel" VARCHAR(30),
    "category" VARCHAR(60),
    "launch_period" VARCHAR(10),
    "period" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "pvi_sales_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_budget_versions" (
    "id" TEXT NOT NULL,
    "fiscal_year" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "scenario_code" VARCHAR(40),
    "status" "FinBudgetStatus" NOT NULL DEFAULT 'draft',
    "notes" VARCHAR(1000),
    "created_by" VARCHAR(100),
    "submitted_at" TIMESTAMP(3),
    "submitted_by" VARCHAR(100),
    "decided_at" TIMESTAMP(3),
    "decided_by" VARCHAR(100),
    "decision_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_budget_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pvi_sales_facts_business_unit_period_idx" ON "pvi_sales_facts"("business_unit", "period");

-- CreateIndex
CREATE INDEX "pvi_sales_facts_product_name_idx" ON "pvi_sales_facts"("product_name");

-- CreateIndex
CREATE INDEX "pvi_sales_facts_batch_id_idx" ON "pvi_sales_facts"("batch_id");

-- CreateIndex
CREATE INDEX "fin_budget_versions_fiscal_year_status_idx" ON "fin_budget_versions"("fiscal_year", "status");

-- AddForeignKey
ALTER TABLE "pvi_sales_facts" ADD CONSTRAINT "pvi_sales_facts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "fin_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
