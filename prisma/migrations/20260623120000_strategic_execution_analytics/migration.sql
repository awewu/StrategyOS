-- CreateTable
CREATE TABLE "strategic_execution_analytics" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "horizon_bubbles_json" JSONB NOT NULL,
    "rice_items_json" JSONB NOT NULL,
    "trl_radar_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_execution_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_execution_analytics_period_key" ON "strategic_execution_analytics"("period");
