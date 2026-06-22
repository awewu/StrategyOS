-- AlterTable
ALTER TABLE "strategic_management_adjustments" ADD COLUMN "statements_json" JSONB;

-- CreateTable
CREATE TABLE "strategic_growth_analytics" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "aarrr_funnel_json" JSONB NOT NULL,
    "keller_brand_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_growth_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_growth_analytics_period_key" ON "strategic_growth_analytics"("period");
