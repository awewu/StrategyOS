-- CreateTable
CREATE TABLE "strategic_bsc_configs" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "cards_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_bsc_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_management_adjustments" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "margin_bridge_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_management_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_bsc_configs_period_key" ON "strategic_bsc_configs"("period");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_management_adjustments_period_key" ON "strategic_management_adjustments"("period");
