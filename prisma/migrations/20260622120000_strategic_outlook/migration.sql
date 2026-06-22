-- Strategic outlook (5-year forecast + sensitivity drivers)
CREATE TABLE "strategic_outlook" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "five_year_forecast_json" JSONB NOT NULL,
    "sensitivity_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_outlook_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "strategic_outlook_period_key" ON "strategic_outlook"("period");
