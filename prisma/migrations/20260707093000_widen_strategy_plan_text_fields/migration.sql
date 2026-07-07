-- Widen strategy-planning natural-language fields so AI-filled PPT/PDF content
-- can be preserved instead of being truncated by short VARCHAR limits.

ALTER TABLE "strategic_plans"
  ALTER COLUMN "north_star" TYPE TEXT,
  ALTER COLUMN "market_position_desc" TYPE TEXT,
  ALTER COLUMN "geography_desc" TYPE TEXT,
  ALTER COLUMN "brand_desc" TYPE TEXT;

ALTER TABLE "plan_key_results"
  ALTER COLUMN "target" TYPE TEXT,
  ALTER COLUMN "keyResult" TYPE TEXT;

ALTER TABLE "plan_initiatives"
  ALTER COLUMN "title" TYPE TEXT,
  ALTER COLUMN "q1_milestone" TYPE TEXT,
  ALTER COLUMN "q2_milestone" TYPE TEXT,
  ALTER COLUMN "q3_milestone" TYPE TEXT,
  ALTER COLUMN "q4_milestone" TYPE TEXT,
  ALTER COLUMN "okr_key_result" TYPE TEXT,
  ALTER COLUMN "okr_target" TYPE TEXT,
  ALTER COLUMN "okr_baseline" TYPE TEXT;

ALTER TABLE "plan_milestones"
  ALTER COLUMN "progress_note" TYPE TEXT;

ALTER TABLE "plan_premises"
  ALTER COLUMN "premise" TYPE TEXT,
  ALTER COLUMN "validation_note" TYPE TEXT,
  ALTER COLUMN "fail_signal" TYPE TEXT;

ALTER TABLE "plan_swot_items"
  ALTER COLUMN "content" TYPE TEXT;

ALTER TABLE "plan_org_chart_nodes"
  ALTER COLUMN "name" TYPE TEXT,
  ALTER COLUMN "role" TYPE TEXT,
  ALTER COLUMN "note" TYPE TEXT;

ALTER TABLE "plan_channel_plans"
  ALTER COLUMN "current_state" TYPE TEXT,
  ALTER COLUMN "target_state" TYPE TEXT,
  ALTER COLUMN "q1_action" TYPE TEXT,
  ALTER COLUMN "q2_action" TYPE TEXT,
  ALTER COLUMN "q3_action" TYPE TEXT,
  ALTER COLUMN "q4_action" TYPE TEXT,
  ALTER COLUMN "note" TYPE TEXT;

ALTER TABLE "plan_customer_plans"
  ALTER COLUMN "customer_segment" TYPE TEXT,
  ALTER COLUMN "acquisition_strategy" TYPE TEXT,
  ALTER COLUMN "retention_strategy" TYPE TEXT,
  ALTER COLUMN "note" TYPE TEXT;

ALTER TABLE "plan_product_quarterly"
  ALTER COLUMN "product_name" TYPE TEXT,
  ALTER COLUMN "note" TYPE TEXT;

ALTER TABLE "plan_market_insights"
  ALTER COLUMN "title" TYPE TEXT,
  ALTER COLUMN "data_point" TYPE TEXT,
  ALTER COLUMN "source" TYPE TEXT;

ALTER TABLE "plan_action_items"
  ALTER COLUMN "initiative_title" TYPE TEXT;

ALTER TABLE "plan_budget_items"
  ALTER COLUMN "initiative_title" TYPE TEXT,
  ALTER COLUMN "department" TYPE TEXT,
  ALTER COLUMN "roi_estimate" TYPE TEXT;

ALTER TABLE "plan_roadmap_items"
  ALTER COLUMN "title" TYPE TEXT,
  ALTER COLUMN "milestone" TYPE TEXT;
