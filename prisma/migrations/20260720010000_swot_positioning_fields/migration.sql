-- Add ten-axis SWOT positioning fields to plan_swot_items.
-- weight/intensity (1..5 scales) + dimension (product/gtm/brand/strategy) power the
-- cross-axis positioning and TOWS engine reused from the market module.
-- Idempotent: only adds columns if they do not already exist.

ALTER TABLE "plan_swot_items" ADD COLUMN IF NOT EXISTS "weight" INTEGER;
ALTER TABLE "plan_swot_items" ADD COLUMN IF NOT EXISTS "intensity" INTEGER;
ALTER TABLE "plan_swot_items" ADD COLUMN IF NOT EXISTS "dimension" TEXT;
