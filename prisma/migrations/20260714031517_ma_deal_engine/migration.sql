-- CreateTable
CREATE TABLE "ma_deal_type_profiles" (
    "id" TEXT NOT NULL,
    "deal_type" VARCHAR(30) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "thresholds" JSONB NOT NULL DEFAULT '{}',
    "required_flags" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_deal_type_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ma_deals" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "deal_type" VARCHAR(30) NOT NULL DEFAULT 'acquisition',
    "direction" VARCHAR(30) NOT NULL,
    "stage" VARCHAR(20) NOT NULL DEFAULT 'sourcing',
    "thesis" VARCHAR(500) NOT NULL,
    "linked_crux" VARCHAR(300),
    "deal_lead" VARCHAR(50),
    "budget_tag" VARCHAR(50),
    "price" DECIMAL(16,2),
    "walk_away_price" DECIMAL(16,2),
    "discount_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.12,
    "deal_structure" JSONB NOT NULL DEFAULT '{}',
    "economics" JSONB NOT NULL DEFAULT '{}',
    "flags" JSONB NOT NULL DEFAULT '{}',
    "screening" JSONB NOT NULL DEFAULT '[]',
    "integration_milestone_100d" TEXT,
    "linked_assumption_codes" TEXT[],
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ma_valuations" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "method" VARCHAR(20) NOT NULL,
    "low" DECIMAL(16,2) NOT NULL,
    "base" DECIMAL(16,2) NOT NULL,
    "high" DECIMAL(16,2) NOT NULL,
    "note" VARCHAR(300),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ma_synergies" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "run_rate" DECIMAL(14,2) NOT NULL,
    "ramp" JSONB NOT NULL DEFAULT '[]',
    "one_time_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "evidence_level" INTEGER NOT NULL DEFAULT 2,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_synergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ma_dd_findings" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "workstream" VARCHAR(30) NOT NULL,
    "finding" VARCHAR(500) NOT NULL,
    "severity" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "deal_breaker" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(12) NOT NULL DEFAULT 'open',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_dd_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ma_condition_precedents" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "item" VARCHAR(300) NOT NULL,
    "owner" VARCHAR(50),
    "due_date" TIMESTAMP(3),
    "status" VARCHAR(12) NOT NULL DEFAULT 'open',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_condition_precedents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ma_deal_type_profiles_deal_type_key" ON "ma_deal_type_profiles"("deal_type");

-- CreateIndex
CREATE INDEX "ma_deals_stage_idx" ON "ma_deals"("stage");

-- CreateIndex
CREATE INDEX "ma_valuations_deal_id_idx" ON "ma_valuations"("deal_id");

-- CreateIndex
CREATE INDEX "ma_synergies_deal_id_idx" ON "ma_synergies"("deal_id");

-- CreateIndex
CREATE INDEX "ma_dd_findings_deal_id_idx" ON "ma_dd_findings"("deal_id");

-- CreateIndex
CREATE INDEX "ma_condition_precedents_deal_id_idx" ON "ma_condition_precedents"("deal_id");

-- AddForeignKey
ALTER TABLE "ma_valuations" ADD CONSTRAINT "ma_valuations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "ma_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ma_synergies" ADD CONSTRAINT "ma_synergies_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "ma_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ma_dd_findings" ADD CONSTRAINT "ma_dd_findings_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "ma_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ma_condition_precedents" ADD CONSTRAINT "ma_condition_precedents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "ma_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: 交易形态画像（可编辑数据行，非硬编码）
INSERT INTO "ma_deal_type_profiles" ("id","deal_type","name","thresholds","required_flags","updated_at") VALUES
(gen_random_uuid(), 'acquisition', '收购（控股）', '{"maxPaybackYears":6,"minRoicOverWacc":0,"maxSynergyPctOfPrice":0.5,"minEvidenceLevel":4}', '[]', NOW()),
(gen_random_uuid(), 'merger', '并购（换股/对等）', '{"maxPaybackYears":6,"minRoicOverWacc":0,"maxSynergyPctOfPrice":0.5,"minEvidenceLevel":4}', '[{"key":"exchange_ratio_agreed","label":"换股比例与治理安排确定"}]', NOW()),
(gen_random_uuid(), 'minority_investment', '投资（少数股权）', '{"maxPaybackYears":8,"minRoicOverWacc":0,"maxSynergyPctOfPrice":1,"minEvidenceLevel":3}', '[{"key":"exit_rights","label":"退出权（回购/随售/IPO）"},{"key":"anti_dilution","label":"反稀释条款"}]', NOW()),
(gen_random_uuid(), 'jv', '合资 JV', '{"maxPaybackYears":8,"minRoicOverWacc":0,"maxSynergyPctOfPrice":1,"minEvidenceLevel":3}', '[{"key":"deadlock_mechanism","label":"僵局解决机制"},{"key":"control_clarity","label":"控制权/否决权清单明确"},{"key":"exit_mechanism","label":"退出机制"}]', NOW());

-- Legacy: ma_pipeline_items → ma_deals 平滑迁移（老表保留只读）
INSERT INTO "ma_deals" ("id","name","deal_type","direction","stage","thesis","integration_milestone_100d","linked_assumption_codes","period","discount_rate","deal_structure","economics","flags","screening","updated_at")
SELECT gen_random_uuid(), name,
  CASE WHEN direction::text = 'jv' THEN 'jv' ELSE 'acquisition' END,
  direction::text,
  CASE stage::text WHEN 'watch' THEN 'sourcing' WHEN 'screen' THEN 'screening' WHEN 'dd' THEN 'dd' WHEN 'signed' THEN 'approval' WHEN 'integrating' THEN 'integration' ELSE 'sourcing' END,
  COALESCE(synergy_thesis,'') || CASE WHEN valuation_range IS NOT NULL AND valuation_range <> '' THEN '（估值参考:' || valuation_range || '）' ELSE '' END,
  integration_milestone_100d,
  linked_assumption_codes,
  period, 0.12, '{}', '{}', '{}', '[]',
  NOW()
FROM "ma_pipeline_items";
