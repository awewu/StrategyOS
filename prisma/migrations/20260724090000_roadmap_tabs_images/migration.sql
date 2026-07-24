ALTER TABLE "strategic_plans"
  ADD COLUMN "roadmap_tabs" JSONB;

ALTER TABLE "plan_roadmap_items"
  ADD COLUMN "roadmap_tab_id" VARCHAR(80),
  ADD COLUMN "roadmap_tab_name" VARCHAR(120),
  ADD COLUMN "image_attachment_id" VARCHAR(100),
  ADD COLUMN "image_filename" VARCHAR(255);

CREATE INDEX "plan_roadmap_items_plan_id_roadmap_tab_id_idx"
  ON "plan_roadmap_items"("plan_id", "roadmap_tab_id");
