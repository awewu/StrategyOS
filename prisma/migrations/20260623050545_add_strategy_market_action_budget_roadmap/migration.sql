-- CreateTable
CREATE TABLE "plan_market_insights" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "data_point" VARCHAR(200),
    "source" VARCHAR(200),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_market_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_action_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "initiative_title" VARCHAR(200),
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "owner_name" VARCHAR(100),
    "acceptance_criteria" TEXT,
    "check_date" VARCHAR(20),
    "status" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_budget_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "initiative_title" VARCHAR(200),
    "department" VARCHAR(100),
    "description" TEXT NOT NULL,
    "year1_amount" VARCHAR(50),
    "year2_amount" VARCHAR(50),
    "year3_amount" VARCHAR(50),
    "total_amount" VARCHAR(50),
    "roi_estimate" VARCHAR(100),
    "justification" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_roadmap_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "track" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "start_year" INTEGER NOT NULL,
    "start_q" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "end_q" INTEGER NOT NULL,
    "milestone" VARCHAR(200),
    "color" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_roadmap_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_market_insights_plan_id_category_idx" ON "plan_market_insights"("plan_id", "category");

-- CreateIndex
CREATE INDEX "plan_action_items_plan_id_year_quarter_idx" ON "plan_action_items"("plan_id", "year", "quarter");

-- CreateIndex
CREATE INDEX "plan_budget_items_plan_id_category_idx" ON "plan_budget_items"("plan_id", "category");

-- CreateIndex
CREATE INDEX "plan_roadmap_items_plan_id_track_idx" ON "plan_roadmap_items"("plan_id", "track");

-- AddForeignKey
ALTER TABLE "plan_market_insights" ADD CONSTRAINT "plan_market_insights_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_action_items" ADD CONSTRAINT "plan_action_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_budget_items" ADD CONSTRAINT "plan_budget_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_roadmap_items" ADD CONSTRAINT "plan_roadmap_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
