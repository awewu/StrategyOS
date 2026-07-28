ALTER TABLE "strategic_plans"
ADD COLUMN "product_quarterly_years" JSONB NOT NULL DEFAULT '[2026, 2027, 2028]'::jsonb;

ALTER TABLE "plan_product_quarterly"
ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2027;

CREATE INDEX "plan_product_quarterly_plan_id_year_idx"
ON "plan_product_quarterly"("plan_id", "year");
