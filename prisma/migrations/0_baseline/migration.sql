-- CreateEnum
CREATE TYPE "AssumptionResult" AS ENUM ('pending', 'validated', 'failed');

-- CreateEnum
CREATE TYPE "AssumptionType" AS ENUM ('general', 'product', 'gtm', 'capital');

-- CreateEnum
CREATE TYPE "BetGateStatus" AS ENUM ('draft', 'review', 'approved', 'rejected', 'killed', 'post_invest', 'deferred');

-- CreateEnum
CREATE TYPE "BottleneckType" AS ENUM ('capability', 'market', 'organization', 'capital');

-- CreateEnum
CREATE TYPE "BrandCode" AS ENUM ('RUIMEI', 'HENGRE', 'RUUD', 'TECH_HOME');

-- CreateEnum
CREATE TYPE "BscDimension" AS ENUM ('FINANCIAL', 'CUSTOMER', 'PROCESS', 'LEARNING');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('pending', 'in_progress', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "CompetePosition" AS ENUM ('lead', 'parity', 'lag');

-- CreateEnum
CREATE TYPE "CompetitorTier" AS ENUM ('core', 'watch', 'fringe');

-- CreateEnum
CREATE TYPE "CompetitorType" AS ENUM ('existing', 'new_entrant', 'substitute');

-- CreateEnum
CREATE TYPE "CynefinDomain" AS ENUM ('clear', 'complicated', 'complex', 'chaotic');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('draft', 'approved');

-- CreateEnum
CREATE TYPE "DiffCategory" AS ENUM ('BSC_TARGET', 'OKR_REPLACE', 'PROJECT_MIGRATE', 'ASSUMPTION_FAILED', 'ASSUMPTION_NEW', 'DOCTRINE_BREACH', 'HEALTH_LIGHT', 'COMMITMENT_DROP', 'SATISFACTION_FAIL', 'RESOURCE_REALLOC', 'COMPETITOR_EVENT', 'INTENT_CHANGE', 'FPA_FORECAST', 'CASH_RUNWAY', 'EMERGENT_PATTERN', 'UNREALIZED', 'SERENDIPITOUS', 'DELIBERATE_RATE_DROP', 'IC_CHANGE', 'CAPSTACK_CHANGE', 'CAPACITY_GAP', 'IC_ROI_DEVIATION', 'ROADMAP_SLIP', 'PRODUCT_BET_CHANGE', 'COMP_GAP_CHANGE', 'PRODUCT_MIX_CHANGE', 'SEGMENT_PRIORITY', 'CHANNEL_CELL_CHANGE', 'COVERAGE_TARGET', 'LTV_CAC_DETERIORATION');

-- CreateEnum
CREATE TYPE "DiffSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "DoctrineTag" AS ENUM ('invest', 'innovate', 'deliver');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('strategy', 'financial', 'product', 'competitor', 'other');

-- CreateEnum
CREATE TYPE "FiveForce" AS ENUM ('existing_rivalry', 'new_entrants', 'substitutes', 'supplier_power', 'buyer_power');

-- CreateEnum
CREATE TYPE "FpaLineType" AS ENUM ('revenue', 'capex', 'opex', 'rd', 'channel');

-- CreateEnum
CREATE TYPE "FpaScope" AS ENUM ('company', 'brand');

-- CreateEnum
CREATE TYPE "FpaToggle" AS ENUM ('on', 'off', 'deferred');

-- CreateEnum
CREATE TYPE "GapAction" AS ENUM ('invest', 'outsource', 'defer_demand');

-- CreateEnum
CREATE TYPE "GapStatus" AS ENUM ('leading', 'parity', 'lagging');

-- CreateEnum
CREATE TYPE "HealthAssertionType" AS ENUM ('runway', 'compliance', 'talent', 'brand');

-- CreateEnum
CREATE TYPE "HoldingStatus" AS ENUM ('CLAIMED', 'DELIVERED', 'HANDED_OVER', 'MISSED');

-- CreateEnum
CREATE TYPE "Horizon" AS ENUM ('H1', 'H2', 'H3');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "InboxStatus" AS ENUM ('OPEN', 'DEFERRED', 'ASSIGNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IntelDimension" AS ENUM ('product', 'gtm', 'brand', 'strategy');

-- CreateEnum
CREATE TYPE "IntelImpact" AS ENUM ('threat', 'opportunity', 'neutral');

-- CreateEnum
CREATE TYPE "IntelSourceHealth" AS ENUM ('active', 'stale', 'empty');

-- CreateEnum
CREATE TYPE "IntelSourceKind" AS ENUM ('official_site', 'press', 'social', 'filing', 'patent', 'channel', 'recruitment');

-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('strategic', 'capacity', 'technology', 'brand', 'people');

-- CreateEnum
CREATE TYPE "MaDirection" AS ENUM ('channel', 'tech', 'jv', 'brand');

-- CreateEnum
CREATE TYPE "MaStage" AS ENUM ('watch', 'screen', 'dd', 'signed', 'integrating');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'ON_HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "MarketVerdict" AS ENUM ('effective', 'assumption_failed', 'inconclusive', 'empty');

-- CreateEnum
CREATE TYPE "MeetingPollType" AS ENUM ('PRIORITY', 'RESOLUTION', 'PULSE');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('INVITING', 'IN_PROGRESS', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('MID_YEAR', 'YEAR_END', 'TOPIC', 'REVIEW');

-- CreateEnum
CREATE TYPE "OnePagerStatus" AS ENUM ('DRAFT', 'APPROVED');

-- CreateEnum
CREATE TYPE "OrgLevel" AS ENUM ('GROUP', 'EXECUTIVE', 'OPERATING_UNIT');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'completed', 'paused');

-- CreateEnum
CREATE TYPE "ReportApproval" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportParseStatus" AS ENUM ('pending', 'parsed', 'failed');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MON_RPT', 'QTR_REV', 'SHEET_IMPORT', 'ANNUAL_RPT', 'MEETING_MINUTES', 'MON_PULSE');

-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('todo', 'in_progress', 'current', 'stale', 'archived');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('none', 'low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "RoadmapLane" AS ENUM ('now', 'next', 'later');

-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('planned', 'in_progress', 'shipped', 'deferred');

-- CreateEnum
CREATE TYPE "SegmentPriority" AS ENUM ('focus', 'explore', 'defer');

-- CreateEnum
CREATE TYPE "SignalReviewStatus" AS ENUM ('draft_ai', 'pending_review', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "SnapshotStatus" AS ENUM ('FROZEN', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('H1', 'FY', 'EVENT');

-- CreateEnum
CREATE TYPE "StrategyFormationType" AS ENUM ('deliberate', 'emergent', 'unrealized', 'serendipitous');

-- CreateEnum
CREATE TYPE "SupportVerdict" AS ENUM ('supported', 'partial', 'unsupported');

-- CreateEnum
CREATE TYPE "TechSignalDomain" AS ENUM ('heat_pump', 'controls', 'channel_tech', 'efficiency');

-- CreateEnum
CREATE TYPE "TechUrgency" AS ENUM ('watch', 'act', 'invest');

-- CreateEnum
CREATE TYPE "TensionSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TensionType" AS ENUM ('direction', 'resource', 'capability', 'adaptation');

-- CreateEnum
CREATE TYPE "ThreatLevel" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "TrafficLight" AS ENUM ('green', 'yellow', 'red');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ceo', 'vp', 'pm', 'staff', 'observer');

-- CreateEnum
CREATE TYPE "WinLossOutcome" AS ENUM ('win', 'loss', 'no_decision');

-- CreateEnum
CREATE TYPE "WorkingVersionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "_ProductBetLines" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "assumptions" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "content" TEXT NOT NULL,
    "assumption_type" "AssumptionType" NOT NULL DEFAULT 'general',
    "cynefin_domain" "CynefinDomain" NOT NULL DEFAULT 'complex',
    "linked_project_id" TEXT,
    "fpa_driver" VARCHAR(50),
    "validation_method" TEXT,
    "result" "AssumptionResult" NOT NULL DEFAULT 'pending',
    "failure_impact" TEXT,
    "mitigation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battlecards" (
    "id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "product_line_id" TEXT,
    "headline" VARCHAR(200) NOT NULL,
    "our_strengths" TEXT[],
    "their_weaknesses" TEXT[],
    "traps" TEXT[],
    "responses" TEXT[],
    "edited_manually" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battlecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_channel_cells" (
    "id" TEXT NOT NULL,
    "brand_code" "BrandCode" NOT NULL,
    "channel_code" VARCHAR(30) NOT NULL,
    "segment_id" TEXT,
    "role" VARCHAR(20) NOT NULL,
    "priority" VARCHAR(5) NOT NULL,
    "target_coverage" INTEGER,
    "linked_kr_ids" TEXT[],

    CONSTRAINT "brand_channel_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_strategy_cards" (
    "id" TEXT NOT NULL,
    "brand_code" "BrandCode" NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "winning_aspiration" VARCHAR(60) NOT NULL,
    "where_to_play_json" JSONB NOT NULL,
    "how_to_win" VARCHAR(200) NOT NULL,
    "must_have_capabilities" TEXT[],
    "linked_bsc_dimension_ids" TEXT[],
    "linked_objective_ids" TEXT[],
    "fpa_anchor" TEXT,
    "working_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_strategy_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cap_stack_periods" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "capex_budget" DECIMAL(14,2) NOT NULL,
    "capex_committed" DECIMAL(14,2) NOT NULL,
    "capex_spent" DECIMAL(14,2) NOT NULL,
    "opex_investment_budget" DECIMAL(14,2) NOT NULL,
    "by_horizon_json" JSONB NOT NULL,
    "by_brand_json" JSONB NOT NULL,
    "by_type_json" JSONB NOT NULL,
    "cash_peak_month" VARCHAR(7),
    "cash_peak_amount" DECIMAL(14,2),
    "runway_after_peak" DECIMAL(6,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cap_stack_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_snapshots" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "demand_units" DECIMAL(12,2) NOT NULL,
    "capacity_units" DECIMAL(12,2) NOT NULL,
    "utilization_pct" DECIMAL(5,2) NOT NULL,
    "gap_units" DECIMAL(12,2) NOT NULL,
    "gap_action" "GapAction" NOT NULL,
    "linked_investment_case_id" TEXT,
    "bottleneck_asset" VARCHAR(200),
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_positions" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "as_of_date" DATE NOT NULL,
    "cash_balance" DECIMAL(14,2) NOT NULL,
    "monthly_burn" DECIMAL(14,2) NOT NULL,
    "runway_months" DECIMAL(6,2) NOT NULL,
    "cash_peak_month" VARCHAR(7),
    "cash_peak_amount" DECIMAL(14,2),
    "runway_after_peak" DECIMAL(6,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commitments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "content" TEXT NOT NULL,
    "promise_to" VARCHAR(50) NOT NULL,
    "deadline" DATE NOT NULL,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'pending',
    "completion_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linked_assumption_code" VARCHAR(10),
    "linked_project_code" VARCHAR(10),
    "owner_name" VARCHAR(50),

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_north_stars" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mission" VARCHAR(500) NOT NULL,
    "vision" VARCHAR(500) NOT NULL,
    "target_year" INTEGER NOT NULL,
    "revenue_target" DECIMAL(14,2) NOT NULL,
    "profit_margin_target" DECIMAL(5,4) NOT NULL,
    "market_position_desc" VARCHAR(200),
    "geography_desc" VARCHAR(200),
    "brand_desc" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_north_stars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_milestones" (
    "id" TEXT NOT NULL,
    "north_star_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "revenue_target" DECIMAL(14,2),
    "profit_margin_target" DECIMAL(5,4),
    "key_conditions" TEXT[],
    "revenue_actual" DECIMAL(14,2),
    "progress_note" VARCHAR(500),
    "risk_score" INTEGER,
    "risk_factors" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compass_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_premise_audits" (
    "id" TEXT NOT NULL,
    "north_star_id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "premise" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "fragility" INTEGER NOT NULL DEFAULT 50,
    "last_validated_at" TIMESTAMP(3),
    "validation_note" VARCHAR(500),
    "fail_signal" VARCHAR(300),
    "signal_source" VARCHAR(100),
    "signal_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compass_premise_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_cells" (
    "id" TEXT NOT NULL,
    "product_line_id" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "threat_level" "ThreatLevel" NOT NULL DEFAULT 'medium',
    "our_position" "CompetePosition" NOT NULL DEFAULT 'parity',
    "market_share_est" DECIMAL(5,2),
    "price_index_us" DECIMAL(6,2),
    "dealer_count_comp" INTEGER,
    "dealer_count_us" INTEGER,
    "summary" TEXT,
    "edited_manually" BOOLEAN NOT NULL DEFAULT false,
    "last_reviewed_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitive_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_positions" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "competitor" VARCHAR(50) NOT NULL,
    "dimension" VARCHAR(100) NOT NULL,
    "our_value" VARCHAR(100),
    "their_value" VARCHAR(100),
    "delta" VARCHAR(100),
    "evidence_source" VARCHAR(200),
    "recorded_by" VARCHAR(50),
    "recorded_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitive_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_product_gaps" (
    "id" TEXT NOT NULL,
    "product_line_id" TEXT NOT NULL,
    "competitor" VARCHAR(50) NOT NULL,
    "dimension" VARCHAR(50) NOT NULL,
    "our_status" "GapStatus" NOT NULL,
    "closure_vx_id" TEXT,
    "notes" TEXT,

    CONSTRAINT "competitive_product_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_brands" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "name_en" VARCHAR(80),
    "competitor_type" "CompetitorType" NOT NULL DEFAULT 'existing',
    "tier" "CompetitorTier" NOT NULL DEFAULT 'watch',
    "threatLevel" "ThreatLevel" NOT NULL DEFAULT 'medium',
    "hq" VARCHAR(80),
    "positioning" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_metric_points" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "brand_id" TEXT,
    "region_id" TEXT,
    "metric_key" VARCHAR(60) NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "source" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_metric_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_products" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT,
    "product_line_id" TEXT,
    "is_ours" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR(120) NOT NULL,
    "model_code" VARCHAR(60),
    "price_min" DECIMAL(12,2),
    "price_max" DECIMAL(12,2),
    "launch_date" DATE,
    "lifecycle" VARCHAR(30),
    "tracked" BOOLEAN NOT NULL DEFAULT true,
    "positioning" TEXT,
    "last_verified_at" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "edited_manually" BOOLEAN NOT NULL DEFAULT false,
    "hot_rank" INTEGER,
    "hot_signal_at" TIMESTAMP(3),
    "hot_signal_note" VARCHAR(500),
    "sales_velocity" VARCHAR(20),

    CONSTRAINT "competitor_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_tracks" (
    "id" TEXT NOT NULL,
    "competitor" VARCHAR(50) NOT NULL,
    "product" TEXT,
    "gtm" TEXT,
    "brand" TEXT,
    "strategy" TEXT,
    "momentum" VARCHAR(10) NOT NULL DEFAULT 'flat',
    "momentum_note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage_snapshots" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "segment_code" VARCHAR(20) NOT NULL,
    "target_count" INTEGER NOT NULL,
    "actual_count" INTEGER NOT NULL,
    "forecast_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culture_award_winners" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "award_name" VARCHAR(100) NOT NULL,
    "winner" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "citation" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culture_award_winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culture_handbooks" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "content_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culture_handbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culture_understanding_records" (
    "id" TEXT NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "author" VARCHAR(100) NOT NULL,
    "summary" TEXT NOT NULL,
    "related_principle" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culture_understanding_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culture_wushi_assessments" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "rival" VARCHAR(50),
    "factors_json" JSONB NOT NULL,
    "qiji_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culture_wushi_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segments" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "priority" "SegmentPriority" NOT NULL DEFAULT 'explore',
    "horizon" "Horizon",
    "jtbd_summary" VARCHAR(200),
    "linked_jtbd_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decode_bsc_rows" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "dim" VARCHAR(30) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "objective" TEXT NOT NULL,
    "must_win" TEXT NOT NULL,
    "operating" JSONB NOT NULL DEFAULT '[]',
    "must_not_fail" TEXT NOT NULL,
    "must_win_status" "TrafficLight" NOT NULL DEFAULT 'yellow',
    "not_fail_status" "TrafficLight" NOT NULL DEFAULT 'yellow',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decode_bsc_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decode_hoshin_entries" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "row_label" VARCHAR(80) NOT NULL,
    "col_label" VARCHAR(80) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "label" VARCHAR(200) NOT NULL,
    "tti" VARCHAR(40) NOT NULL DEFAULT '',
    "okr" VARCHAR(200) NOT NULL DEFAULT '',
    "action" TEXT NOT NULL DEFAULT '',
    "owner" VARCHAR(100) NOT NULL DEFAULT '',
    "correlated" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decode_hoshin_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diff_records" (
    "id" TEXT NOT NULL,
    "from_snapshot_id" TEXT NOT NULL,
    "to_snapshot_id" TEXT NOT NULL,
    "category" "DiffCategory" NOT NULL,
    "severity" "DiffSeverity" NOT NULL DEFAULT 'info',
    "title" VARCHAR(200) NOT NULL,
    "detail" TEXT,
    "object_type" VARCHAR(50),
    "object_id" TEXT,
    "before_json" JSONB,
    "after_json" JSONB,
    "formation_type" "StrategyFormationType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diff_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "content" TEXT,
    "doc_type" "DocumentType" NOT NULL DEFAULT 'other',
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_maturity" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "project_code" VARCHAR(10) NOT NULL,
    "project_name" VARCHAR(100) NOT NULL,
    "owner" VARCHAR(50) NOT NULL,
    "milestone_on_time_rate" DECIMAL(5,4) NOT NULL,
    "assumption_hit_rate" DECIMAL(5,4) NOT NULL,
    "response_latency_days" INTEGER NOT NULL,
    "budget_total" DECIMAL(14,2) NOT NULL,
    "tension_type" "TensionType" NOT NULL,
    "horizon" VARCHAR(5) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_maturity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_scoreboard_configs" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "wig_objective_id" TEXT,
    "leading_kr_ids" TEXT[],
    "lagging_kr_ids" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_scoreboard_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_tensions" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "project_code" VARCHAR(10) NOT NULL,
    "project_name" VARCHAR(100) NOT NULL,
    "tension_type" "TensionType" NOT NULL,
    "signal" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "severity" "TensionSeverity" NOT NULL,
    "linked_assumption_code" VARCHAR(10),
    "linked_kr" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_tensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_loop_records" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "kind" VARCHAR(1) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "chain" VARCHAR(300) NOT NULL,
    "bsc_dimension" VARCHAR(30) NOT NULL,
    "fpa_linked" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_loop_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fpa_brand_pnls" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "brand_code" "BrandCode" NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,
    "gross_margin" DECIMAL(14,2) NOT NULL,
    "opex" DECIMAL(14,2) NOT NULL,
    "net_profit" DECIMAL(14,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fpa_brand_pnls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fpa_budget_lines" (
    "id" TEXT NOT NULL,
    "fpa_period_id" TEXT NOT NULL,
    "budget_tag" VARCHAR(30) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "line_type" "FpaLineType" NOT NULL,
    "amount_budget" DECIMAL(14,2) NOT NULL,
    "amount_actual" DECIMAL(14,2) NOT NULL,
    "amount_forecast" DECIMAL(14,2) NOT NULL,
    "fpa_toggle" "FpaToggle" NOT NULL DEFAULT 'on',
    "ghost_forecast" DECIMAL(14,2),
    "linked_bet_type" VARCHAR(30),
    "linked_bet_id" TEXT,
    "investment_case_id" TEXT,
    "product_bet_id" TEXT,
    "gtm_bet_id" TEXT,

    CONSTRAINT "fpa_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fpa_periods" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "scope" "FpaScope" NOT NULL DEFAULT 'company',
    "brand_code" "BrandCode",
    "revenue_budget" DECIMAL(14,2) NOT NULL,
    "revenue_actual" DECIMAL(14,2) NOT NULL,
    "revenue_forecast" DECIMAL(14,2) NOT NULL,
    "profit_budget" DECIMAL(14,2) NOT NULL,
    "profit_actual" DECIMAL(14,2) NOT NULL,
    "profit_forecast" DECIMAL(14,2) NOT NULL,
    "cash_budget" DECIMAL(14,2),
    "cash_actual" DECIMAL(14,2),
    "cash_forecast" DECIMAL(14,2),
    "linked_assumption_ids" TEXT[],
    "variance_ba" DECIMAL(8,4),
    "variance_bf" DECIMAL(8,4),
    "financial_signal" "TrafficLight" NOT NULL DEFAULT 'green',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fpa_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_checklist_items" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "checklist_id" VARCHAR(30) NOT NULL,
    "item_id" VARCHAR(30) NOT NULL,
    "label" VARCHAR(300) NOT NULL,
    "status" VARCHAR(10) NOT NULL,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_five_force_records" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "force" "FiveForce" NOT NULL,
    "threat_level" "ThreatLevel" NOT NULL DEFAULT 'low',
    "evidence" TEXT,
    "linked_assumption_code" VARCHAR(10),
    "owner" VARCHAR(50),
    "mitigated" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_five_force_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gtm_bets" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "segment_id" TEXT,
    "brand_channel_cell_id" TEXT,
    "success_criteria" TEXT[],
    "kill_criteria" TEXT[],
    "linked_assumption_ids" TEXT[],
    "linked_ic_id" TEXT,
    "budget_tag" VARCHAR(30),
    "fpa_toggle" "FpaToggle" NOT NULL DEFAULT 'off',
    "gate_status" "BetGateStatus" NOT NULL DEFAULT 'draft',
    "doctrine_tags" "DoctrineTag"[],
    "working_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gtm_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_assertions" (
    "id" TEXT NOT NULL,
    "assertion_type" "HealthAssertionType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "source_report_id" TEXT,
    "source_import_batch" VARCHAR(50),
    "message" VARCHAR(300) NOT NULL,
    "metric_value" DECIMAL(12,4),
    "threshold_value" DECIMAL(12,4),
    "remedial_vx_id" TEXT,
    "cleared_at" TIMESTAMP(3),
    "cleared_by_report_id" TEXT,
    "ceo_exception_note" TEXT,
    "ceo_exception_by_id" TEXT,
    "ceo_exception_at" TIMESTAMP(3),
    "snapshot_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_assertions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_signals" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "dimension" VARCHAR(20) NOT NULL,
    "signal" "TrafficLight" NOT NULL,
    "kpi_name" VARCHAR(100),
    "kpi_value" VARCHAR(50),
    "kpi_target" VARCHAR(50),
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_records" (
    "id" TEXT NOT NULL,
    "source_key" VARCHAR(80) NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "summary" TEXT,
    "source_label" VARCHAR(100) NOT NULL,
    "href" VARCHAR(300) NOT NULL,
    "status" "InboxStatus" NOT NULL DEFAULT 'OPEN',
    "owner_name" VARCHAR(50),
    "defer_until" DATE,
    "resolution" TEXT,
    "commitment_id" TEXT,
    "mandate_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intel_reports" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "scope" VARCHAR(200),
    "status" "SignalReviewStatus" NOT NULL DEFAULT 'draft_ai',
    "content" TEXT,
    "edited_content" TEXT,
    "confirmed_by_id" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intel_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intel_signal_reviews" (
    "id" TEXT NOT NULL,
    "signal_id" TEXT NOT NULL,
    "status" "SignalReviewStatus" NOT NULL DEFAULT 'draft_ai',
    "reviewer_name" VARCHAR(60),
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "linked_scenario_code" VARCHAR(30),
    "scenario_probability_delta" DECIMAL(5,3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intel_signal_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intel_signals" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "competitor" VARCHAR(50) NOT NULL,
    "dimension" "IntelDimension" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "summary" TEXT NOT NULL,
    "impact" "IntelImpact" NOT NULL,
    "relevance" INTEGER NOT NULL DEFAULT 50,
    "source_label" VARCHAR(200) NOT NULL,
    "captured_at" DATE NOT NULL,
    "linked_assumption_code" VARCHAR(10),
    "linked_action_code" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence" VARCHAR(300),
    "verdict" "SupportVerdict" NOT NULL DEFAULT 'supported',

    CONSTRAINT "intel_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intel_sources" (
    "id" TEXT NOT NULL,
    "competitor" VARCHAR(50) NOT NULL,
    "kind" "IntelSourceKind" NOT NULL,
    "url" VARCHAR(500),
    "cadence_days" INTEGER NOT NULL DEFAULT 7,
    "last_scraped_at" DATE,
    "health" "IntelSourceHealth" NOT NULL DEFAULT 'empty',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intel_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_cases" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" "InvestmentType" NOT NULL,
    "horizon" "Horizon" NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "linked_vx_id" TEXT,
    "linked_assumption_ids" TEXT[],
    "linked_okr_ids" TEXT[],
    "capex_total" DECIMAL(14,2),
    "opex_annual" DECIMAL(14,2),
    "expected_irr" DECIMAL(6,4),
    "payback_months" INTEGER,
    "npv" DECIMAL(14,2),
    "strategic_fit_score" INTEGER,
    "gate_status" "BetGateStatus" NOT NULL DEFAULT 'draft',
    "budget_tag" VARCHAR(30) NOT NULL,
    "fpa_toggle" "FpaToggle" NOT NULL DEFAULT 'off',
    "doctrine_audit_id" TEXT,
    "cynefin_domain" "CynefinDomain",
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "working_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jtbd_cards" (
    "id" TEXT NOT NULL,
    "product_line_id" TEXT NOT NULL,
    "statement" VARCHAR(200) NOT NULL,
    "primary_segment" VARCHAR(50) NOT NULL,
    "outcome_metrics" TEXT[],
    "linked_okr_ids" TEXT[],

    CONSTRAINT "jtbd_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_results" (
    "id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "doctrine_tag" "DoctrineTag",
    "budget_tag" VARCHAR(30),
    "bsc_measure_id" TEXT,
    "project_id" TEXT,
    "target_value" VARCHAR(50),
    "current_value" VARCHAR(50),
    "confidence" DECIMAL(3,2),
    "is_leading_indicator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ma_pipeline_items" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "direction" "MaDirection" NOT NULL,
    "stage" "MaStage" NOT NULL DEFAULT 'watch',
    "synergy_thesis" VARCHAR(500) NOT NULL,
    "valuation_range" VARCHAR(80) NOT NULL,
    "linked_assumption_codes" TEXT[],
    "integration_milestone_100d" TEXT,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ma_pipeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandate_holdings" (
    "id" TEXT NOT NULL,
    "mandate_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "holder_name" VARCHAR(50) NOT NULL,
    "holder_role" VARCHAR(100) NOT NULL,
    "invited_at" TIMESTAMP(3),
    "attended_at" TIMESTAMP(3),
    "status" "HoldingStatus" NOT NULL DEFAULT 'CLAIMED',
    "commitment" TEXT,
    "deadline" DATE,
    "delivery_note" TEXT,
    "handover_note" TEXT,
    "handover_to_name" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandate_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_evidence" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "action_label" VARCHAR(200) NOT NULL,
    "action_code" VARCHAR(10),
    "linked_assumption_code" VARCHAR(10),
    "evidence_text" TEXT,
    "evidence_source" VARCHAR(200),
    "recorded_by" VARCHAR(50),
    "recorded_at" DATE,
    "verdict" "MarketVerdict" NOT NULL DEFAULT 'empty',
    "verdict_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_self_scores" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "scores_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_self_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_poll_responses" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "voter_label" VARCHAR(50),
    "choice_key" VARCHAR(50),
    "pulse_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_poll_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_polls" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT,
    "poll_type" "MeetingPollType" NOT NULL,
    "question" VARCHAR(300) NOT NULL,
    "options_json" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "linked_inbox_source_key" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mkt_product_lines" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "owner_org_id" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "mkt_product_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectives" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_metric_actuals" (
    "id" TEXT NOT NULL,
    "metric_id" VARCHAR(30) NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "actual" DECIMAL(14,4),
    "planned" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "ops_metric_actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_units" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "level" "OrgLevel" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_assumptions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "assumption" TEXT NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_attachments" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_initiatives" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "owner_name" VARCHAR(100),
    "q1_milestone" VARCHAR(200),
    "q2_milestone" VARCHAR(200),
    "q3_milestone" VARCHAR(200),
    "q4_milestone" VARCHAR(200),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_initiatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_key_results" (
    "id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "target" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keyResult" VARCHAR(300) NOT NULL,

    CONSTRAINT "plan_key_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_milestones" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "revenue_target" DECIMAL(14,2),
    "profit_margin_target" DECIMAL(5,4),
    "key_conditions" TEXT[],
    "revenue_actual" DECIMAL(14,2),
    "progress_note" VARCHAR(500),
    "risk_score" INTEGER,
    "risk_factors" TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_objectives" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "dimension" "BscDimension" NOT NULL,
    "objective" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "must_not_fail" TEXT,
    "must_win_status" "TrafficLight" NOT NULL DEFAULT 'yellow',
    "not_fail_status" "TrafficLight" NOT NULL DEFAULT 'yellow',

    CONSTRAINT "plan_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_premises" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "premise" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "fragility" INTEGER NOT NULL DEFAULT 50,
    "last_validated_at" TIMESTAMP(3),
    "validation_note" VARCHAR(500),
    "fail_signal" VARCHAR(300),
    "signal_source" VARCHAR(100),
    "signal_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_premises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bets" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "horizon" "Horizon" NOT NULL,
    "linked_diagnosis_crux" VARCHAR(120),
    "linked_vx_ids" TEXT[],
    "linked_ic_id" TEXT,
    "success_criteria" TEXT[],
    "kill_criteria" TEXT[],
    "budget_tag" VARCHAR(30),
    "fpa_toggle" "FpaToggle" NOT NULL DEFAULT 'off',
    "gate_status" "BetGateStatus" NOT NULL DEFAULT 'draft',
    "doctrine_innovate_audit_id" TEXT,
    "cynefin_domain" "CynefinDomain",
    "working_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_lines" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "brand_code" "BrandCode" NOT NULL,
    "horizon" "Horizon",
    "lifecycle_stage" VARCHAR(30),
    "revenue_share_pct" DECIMAL(5,2),
    "linked_bsc_measure_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_roadmap_items" (
    "id" TEXT NOT NULL,
    "product_line_id" TEXT NOT NULL,
    "lane" "RoadmapLane" NOT NULL,
    "milestone" VARCHAR(200) NOT NULL,
    "target_quarter" VARCHAR(7) NOT NULL,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'planned',
    "linked_vx_id" TEXT,
    "linked_assumption_ids" TEXT[],
    "confidence" DECIMAL(3,2),

    CONSTRAINT "product_roadmap_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_spec_dimensions" (
    "id" TEXT NOT NULL,
    "product_line_id" TEXT NOT NULL,
    "key" VARCHAR(60) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "unit" VARCHAR(30),
    "higher_better" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_spec_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_spec_values" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "dimension_id" TEXT NOT NULL,
    "value_num" DECIMAL(14,4),
    "value_text" VARCHAR(200),
    "position" "CompetePosition",
    "note" VARCHAR(300),
    "edited_manually" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_spec_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "owner_id" TEXT,
    "cynefin_domain" "CynefinDomain" NOT NULL DEFAULT 'complicated',
    "horizon" "Horizon",
    "budget_tag" VARCHAR(30),
    "budget_total" DECIMAL(14,2),
    "budget_spent" DECIMAL(14,2),
    "budget_remaining" DECIMAL(14,2),
    "current_milestone" VARCHAR(200),
    "progress_percent" DECIMAL(5,2),
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'none',
    "risk_description" TEXT,
    "next_action" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "raw_content" TEXT,
    "parsed_json" JSONB,
    "uploaded_by_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approval_status" "ReportApproval" NOT NULL DEFAULT 'PENDING',
    "file_mime" VARCHAR(120),
    "file_orig_name" VARCHAR(300),
    "file_path" VARCHAR(400),
    "file_size_bytes" INTEGER,
    "org_unit_id" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_items" (
    "id" TEXT NOT NULL,
    "cell_id" TEXT,
    "brand_id" TEXT NOT NULL,
    "dimension" "IntelDimension" NOT NULL,
    "subtopic" VARCHAR(80) NOT NULL,
    "status" "ResearchStatus" NOT NULL DEFAULT 'todo',
    "findings" TEXT,
    "evidence" TEXT,
    "owner_org_id" TEXT,
    "owner_name" VARCHAR(60),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "source_reliability" VARCHAR(2),
    "info_credibility" INTEGER,
    "review_every_days" INTEGER NOT NULL DEFAULT 30,
    "last_reviewed_at" DATE,
    "origin" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "edited_manually" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_requests" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(14,2),
    "unit" VARCHAR(20),
    "justification" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_regions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "parent_id" TEXT,
    "org_unit_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_economics" (
    "id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "ltv" DECIMAL(14,2),
    "cac" DECIMAL(14,2),
    "ltv_cac_ratio" DECIMAL(6,2),
    "signal" "TrafficLight" NOT NULL DEFAULT 'green',

    CONSTRAINT "segment_economics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spbp_scenarios" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "probability" DECIMAL(5,2) NOT NULL,
    "drivers" TEXT[],
    "revenue_impact" DECIMAL(14,2) NOT NULL,
    "profit_impact" DECIMAL(14,2) NOT NULL,
    "runway_months" DECIMAL(6,2) NOT NULL,
    "linked_assumption_codes" TEXT[],
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spbp_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_bsc_configs" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "cards_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_bsc_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_capital_configs" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "real_options_json" JSONB NOT NULL,
    "post_invest_deviations_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_capital_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_command_configs" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "decisions_json" JSONB,
    "timeline_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_command_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_diagnoses" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "challenge_statement" VARCHAR(80) NOT NULL,
    "bottleneck_type" "BottleneckType" NOT NULL,
    "root_causes" TEXT[],
    "crux" VARCHAR(120) NOT NULL,
    "linked_assumption_ids" TEXT[],
    "linked_bsc_measure_ids" TEXT[],
    "fpa_rationale" TEXT,
    "valid_until" DATE NOT NULL,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'draft',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "working_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_diagnoses_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "strategic_growth_analytics" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "aarrr_funnel_json" JSONB NOT NULL,
    "keller_brand_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_growth_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_management_adjustments" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "margin_bridge_json" JSONB,
    "statements_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_management_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_outlook" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "five_year_forecast_json" JSONB NOT NULL,
    "sensitivity_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_outlook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_plans" (
    "id" TEXT NOT NULL,
    "org_unit_id" TEXT NOT NULL,
    "horizon_start" INTEGER NOT NULL,
    "horizon_end" INTEGER NOT NULL,
    "intent" TEXT,
    "north_star" VARCHAR(200),
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "brand_desc" VARCHAR(200),
    "geography_desc" VARCHAR(200),
    "market_position_desc" VARCHAR(200),
    "profit_margin_target" DECIMAL(5,4),
    "revenue_target" DECIMAL(14,2),
    "target_year" INTEGER,

    CONSTRAINT "strategic_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_snapshots" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "snapshot_type" "SnapshotType" NOT NULL,
    "status" "SnapshotStatus" NOT NULL DEFAULT 'FROZEN',
    "frozen_at" TIMESTAMP(3) NOT NULL,
    "frozen_by_id" TEXT NOT NULL,
    "working_version_id" TEXT,
    "meeting_notes" TEXT,
    "diagnosis_id" TEXT,
    "cap_stack_period_id" TEXT,
    "cash_position_id" TEXT,
    "health_assertion_ids" TEXT[],
    "bsc_lights_at_freeze" JSONB NOT NULL,
    "state_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategic_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_mandates" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "theme" VARCHAR(100),
    "description" TEXT,
    "status" "MandateStatus" NOT NULL DEFAULT 'ACTIVE',
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "origin_meeting_id" TEXT,
    "linked_project_code" VARCHAR(10),
    "linked_assumption_code" VARCHAR(10),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_meetings" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "meeting_type" "MeetingType" NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "meeting_date" DATE,
    "status" "MeetingStatus" NOT NULL DEFAULT 'INVITING',
    "agenda" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_one_pager_revisions" (
    "id" TEXT NOT NULL,
    "one_pager_id" TEXT NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "actor" VARCHAR(100),
    "content_json" JSONB NOT NULL,
    "diff_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_one_pager_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_one_pagers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT 'china-summary',
    "status" "OnePagerStatus" NOT NULL DEFAULT 'DRAFT',
    "content_json" JSONB NOT NULL,
    "approved_at" TIMESTAMP(3),
    "approved_by" VARCHAR(100),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_one_pagers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_patterns" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "deliberate_realization_rate" DECIMAL(5,2) NOT NULL,
    "emergent_patterns" JSONB NOT NULL,
    "unrealized_items" JSONB NOT NULL,
    "serendipitous_items" JSONB NOT NULL,
    "learning_prompts" TEXT[],
    "computed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" VARCHAR(50) NOT NULL,
    "value" VARCHAR(200) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "tech_signal_records" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "domain" "TechSignalDomain" NOT NULL,
    "trl" INTEGER NOT NULL DEFAULT 1,
    "source" VARCHAR(200) NOT NULL,
    "horizon" "Horizon" NOT NULL,
    "linked_project_code" VARCHAR(10),
    "urgency" "TechUrgency" NOT NULL DEFAULT 'watch',
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_signal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twelve_dim_scores" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "dim_id" VARCHAR(10) NOT NULL,
    "score" INTEGER NOT NULL,
    "signal" VARCHAR(10) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twelve_dim_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(200) NOT NULL,
    "metadata" JSONB,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" VARCHAR(64),
    "prev_hash" VARCHAR(64),

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL,
    "brand_tag" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "org_unit_id" TEXT,
    "project_code" VARCHAR(10),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "win_loss_records" (
    "id" TEXT NOT NULL,
    "outcome" "WinLossOutcome" NOT NULL,
    "cell_id" TEXT,
    "region_id" TEXT NOT NULL,
    "competitor_id" TEXT,
    "product_line_id" TEXT,
    "project_name" VARCHAR(200),
    "deal_size_cny" DECIMAL(14,2),
    "loss_reason" TEXT,
    "win_reason" TEXT,
    "customer_type" VARCHAR(60),
    "recorded_by_id" TEXT,
    "recorded_at" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "win_loss_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_versions" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "status" "WorkingVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "based_on_snapshot_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProductBetLines_AB_unique" ON "_ProductBetLines"("A" ASC, "B" ASC);

-- CreateIndex
CREATE INDEX "_ProductBetLines_B_index" ON "_ProductBetLines"("B" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "assumptions_code_period_key" ON "assumptions"("code" ASC, "period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "battlecards_competitor_id_product_line_id_key" ON "battlecards"("competitor_id" ASC, "product_line_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "brand_channel_cells_brand_code_channel_code_segment_id_key" ON "brand_channel_cells"("brand_code" ASC, "channel_code" ASC, "segment_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "brand_strategy_cards_brand_code_period_working_version_id_key" ON "brand_strategy_cards"("brand_code" ASC, "period" ASC, "working_version_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "cap_stack_periods_period_key" ON "cap_stack_periods"("period" ASC);

-- CreateIndex
CREATE INDEX "capacity_snapshots_period_idx" ON "capacity_snapshots"("period" ASC);

-- CreateIndex
CREATE INDEX "cash_positions_period_idx" ON "cash_positions"("period" ASC);

-- CreateIndex
CREATE INDEX "compass_milestones_north_star_id_year_idx" ON "compass_milestones"("north_star_id" ASC, "year" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "competitive_cells_product_line_id_region_id_competitor_id_key" ON "competitive_cells"("product_line_id" ASC, "region_id" ASC, "competitor_id" ASC);

-- CreateIndex
CREATE INDEX "competitive_cells_product_line_id_threat_level_idx" ON "competitive_cells"("product_line_id" ASC, "threat_level" ASC);

-- CreateIndex
CREATE INDEX "competitive_cells_region_id_idx" ON "competitive_cells"("region_id" ASC);

-- CreateIndex
CREATE INDEX "competitive_positions_period_idx" ON "competitive_positions"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "competitor_brands_name_key" ON "competitor_brands"("name" ASC);

-- CreateIndex
CREATE INDEX "competitor_brands_tier_active_idx" ON "competitor_brands"("tier" ASC, "active" ASC);

-- CreateIndex
CREATE INDEX "competitor_metric_points_brand_id_metric_key_idx" ON "competitor_metric_points"("brand_id" ASC, "metric_key" ASC);

-- CreateIndex
CREATE INDEX "competitor_metric_points_metric_key_period_idx" ON "competitor_metric_points"("metric_key" ASC, "period" ASC);

-- CreateIndex
CREATE INDEX "competitor_products_brand_id_tracked_idx" ON "competitor_products"("brand_id" ASC, "tracked" ASC);

-- CreateIndex
CREATE INDEX "competitor_products_product_line_id_idx" ON "competitor_products"("product_line_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "competitor_tracks_competitor_key" ON "competitor_tracks"("competitor" ASC);

-- CreateIndex
CREATE INDEX "coverage_snapshots_period_segment_code_idx" ON "coverage_snapshots"("period" ASC, "segment_code" ASC);

-- CreateIndex
CREATE INDEX "culture_award_winners_year_idx" ON "culture_award_winners"("year" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "culture_handbooks_period_key" ON "culture_handbooks"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "culture_wushi_assessments_period_key" ON "culture_wushi_assessments"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "customer_segments_code_key" ON "customer_segments"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "decode_bsc_rows_period_dim_key" ON "decode_bsc_rows"("period" ASC, "dim" ASC);

-- CreateIndex
CREATE INDEX "decode_bsc_rows_period_idx" ON "decode_bsc_rows"("period" ASC);

-- CreateIndex
CREATE INDEX "decode_hoshin_entries_period_sort_order_idx" ON "decode_hoshin_entries"("period" ASC, "sort_order" ASC);

-- CreateIndex
CREATE INDEX "diff_records_from_snapshot_id_to_snapshot_id_idx" ON "diff_records"("from_snapshot_id" ASC, "to_snapshot_id" ASC);

-- CreateIndex
CREATE INDEX "execution_maturity_period_idx" ON "execution_maturity"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "execution_maturity_period_project_code_key" ON "execution_maturity"("period" ASC, "project_code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "execution_scoreboard_configs_period_key" ON "execution_scoreboard_configs"("period" ASC);

-- CreateIndex
CREATE INDEX "execution_tensions_period_idx" ON "execution_tensions"("period" ASC);

-- CreateIndex
CREATE INDEX "feedback_loop_records_period_idx" ON "feedback_loop_records"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "fpa_brand_pnls_period_brand_code_key" ON "fpa_brand_pnls"("period" ASC, "brand_code" ASC);

-- CreateIndex
CREATE INDEX "fpa_budget_lines_budget_tag_idx" ON "fpa_budget_lines"("budget_tag" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "fpa_budget_lines_fpa_period_id_budget_tag_key" ON "fpa_budget_lines"("fpa_period_id" ASC, "budget_tag" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "fpa_periods_period_scope_brand_code_key" ON "fpa_periods"("period" ASC, "scope" ASC, "brand_code" ASC);

-- CreateIndex
CREATE INDEX "gate_checklist_items_period_checklist_id_idx" ON "gate_checklist_items"("period" ASC, "checklist_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "gate_checklist_items_period_checklist_id_item_id_key" ON "gate_checklist_items"("period" ASC, "checklist_id" ASC, "item_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "gate_five_force_records_period_force_key" ON "gate_five_force_records"("period" ASC, "force" ASC);

-- CreateIndex
CREATE INDEX "gate_five_force_records_period_idx" ON "gate_five_force_records"("period" ASC);

-- CreateIndex
CREATE INDEX "gtm_bets_period_gate_status_idx" ON "gtm_bets"("period" ASC, "gate_status" ASC);

-- CreateIndex
CREATE INDEX "health_assertions_active_assertion_type_idx" ON "health_assertions"("active" ASC, "assertion_type" ASC);

-- CreateIndex
CREATE INDEX "health_signals_period_dimension_idx" ON "health_signals"("period" ASC, "dimension" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "inbox_records_source_key_key" ON "inbox_records"("source_key" ASC);

-- CreateIndex
CREATE INDEX "inbox_records_status_idx" ON "inbox_records"("status" ASC);

-- CreateIndex
CREATE INDEX "intel_reports_period_status_idx" ON "intel_reports"("period" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "intel_signal_reviews_signal_id_key" ON "intel_signal_reviews"("signal_id" ASC);

-- CreateIndex
CREATE INDEX "intel_signals_captured_at_idx" ON "intel_signals"("captured_at" DESC);

-- CreateIndex
CREATE INDEX "intel_signals_competitor_dimension_idx" ON "intel_signals"("competitor" ASC, "dimension" ASC);

-- CreateIndex
CREATE INDEX "intel_signals_impact_relevance_idx" ON "intel_signals"("impact" ASC, "relevance" DESC);

-- CreateIndex
CREATE INDEX "intel_sources_competitor_idx" ON "intel_sources"("competitor" ASC);

-- CreateIndex
CREATE INDEX "intel_sources_health_idx" ON "intel_sources"("health" ASC);

-- CreateIndex
CREATE INDEX "investment_cases_budget_tag_idx" ON "investment_cases"("budget_tag" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "investment_cases_code_key" ON "investment_cases"("code" ASC);

-- CreateIndex
CREATE INDEX "investment_cases_period_gate_status_idx" ON "investment_cases"("period" ASC, "gate_status" ASC);

-- CreateIndex
CREATE INDEX "key_results_budget_tag_idx" ON "key_results"("budget_tag" ASC);

-- CreateIndex
CREATE INDEX "ma_pipeline_items_stage_idx" ON "ma_pipeline_items"("stage" ASC);

-- CreateIndex
CREATE INDEX "mandate_holdings_mandate_id_idx" ON "mandate_holdings"("mandate_id" ASC);

-- CreateIndex
CREATE INDEX "mandate_holdings_meeting_id_idx" ON "mandate_holdings"("meeting_id" ASC);

-- CreateIndex
CREATE INDEX "market_evidence_period_idx" ON "market_evidence"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "market_self_scores_period_key" ON "market_self_scores"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "mkt_product_lines_code_key" ON "mkt_product_lines"("code" ASC);

-- CreateIndex
CREATE INDEX "mkt_product_lines_owner_org_id_idx" ON "mkt_product_lines"("owner_org_id" ASC);

-- CreateIndex
CREATE INDEX "mkt_product_lines_parent_id_idx" ON "mkt_product_lines"("parent_id" ASC);

-- CreateIndex
CREATE INDEX "objectives_period_idx" ON "objectives"("period" ASC);

-- CreateIndex
CREATE INDEX "ops_metric_actuals_metric_id_idx" ON "ops_metric_actuals"("metric_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ops_metric_actuals_metric_id_month_key" ON "ops_metric_actuals"("metric_id" ASC, "month" ASC);

-- CreateIndex
CREATE INDEX "ops_metric_actuals_month_idx" ON "ops_metric_actuals"("month" ASC);

-- CreateIndex
CREATE INDEX "org_units_level_sort_order_idx" ON "org_units"("level" ASC, "sort_order" ASC);

-- CreateIndex
CREATE INDEX "org_units_parent_id_idx" ON "org_units"("parent_id" ASC);

-- CreateIndex
CREATE INDEX "plan_assumptions_plan_id_idx" ON "plan_assumptions"("plan_id" ASC);

-- CreateIndex
CREATE INDEX "plan_attachments_plan_id_idx" ON "plan_attachments"("plan_id" ASC);

-- CreateIndex
CREATE INDEX "plan_initiatives_plan_id_idx" ON "plan_initiatives"("plan_id" ASC);

-- CreateIndex
CREATE INDEX "plan_key_results_objective_id_idx" ON "plan_key_results"("objective_id" ASC);

-- CreateIndex
CREATE INDEX "plan_milestones_plan_id_year_idx" ON "plan_milestones"("plan_id" ASC, "year" ASC);

-- CreateIndex
CREATE INDEX "plan_objectives_plan_id_dimension_idx" ON "plan_objectives"("plan_id" ASC, "dimension" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "plan_premises_plan_id_code_key" ON "plan_premises"("plan_id" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "plan_premises_plan_id_idx" ON "plan_premises"("plan_id" ASC);

-- CreateIndex
CREATE INDEX "product_bets_period_gate_status_idx" ON "product_bets"("period" ASC, "gate_status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "product_lines_code_key" ON "product_lines"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "product_spec_dimensions_product_line_id_key_key" ON "product_spec_dimensions"("product_line_id" ASC, "key" ASC);

-- CreateIndex
CREATE INDEX "product_spec_dimensions_product_line_id_sort_order_idx" ON "product_spec_dimensions"("product_line_id" ASC, "sort_order" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "product_spec_values_product_id_dimension_id_key" ON "product_spec_values"("product_id" ASC, "dimension_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code" ASC);

-- CreateIndex
CREATE INDEX "reports_org_unit_id_idx" ON "reports"("org_unit_id" ASC);

-- CreateIndex
CREATE INDEX "reports_period_report_type_idx" ON "reports"("period" ASC, "report_type" ASC);

-- CreateIndex
CREATE INDEX "research_items_brand_id_dimension_idx" ON "research_items"("brand_id" ASC, "dimension" ASC);

-- CreateIndex
CREATE INDEX "research_items_cell_id_idx" ON "research_items"("cell_id" ASC);

-- CreateIndex
CREATE INDEX "research_items_status_idx" ON "research_items"("status" ASC);

-- CreateIndex
CREATE INDEX "resource_requests_plan_id_idx" ON "resource_requests"("plan_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sales_regions_code_key" ON "sales_regions"("code" ASC);

-- CreateIndex
CREATE INDEX "sales_regions_parent_id_idx" ON "sales_regions"("parent_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "segment_economics_segment_id_period_key" ON "segment_economics"("segment_id" ASC, "period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "spbp_scenarios_code_key" ON "spbp_scenarios"("code" ASC);

-- CreateIndex
CREATE INDEX "spbp_scenarios_period_idx" ON "spbp_scenarios"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_bsc_configs_period_key" ON "strategic_bsc_configs"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_capital_configs_period_key" ON "strategic_capital_configs"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_command_configs_period_key" ON "strategic_command_configs"("period" ASC);

-- CreateIndex
CREATE INDEX "strategic_diagnoses_period_status_idx" ON "strategic_diagnoses"("period" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_execution_analytics_period_key" ON "strategic_execution_analytics"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_growth_analytics_period_key" ON "strategic_growth_analytics"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_management_adjustments_period_key" ON "strategic_management_adjustments"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_outlook_period_key" ON "strategic_outlook"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_plans_org_unit_id_horizon_start_horizon_end_key" ON "strategic_plans"("org_unit_id" ASC, "horizon_start" ASC, "horizon_end" ASC);

-- CreateIndex
CREATE INDEX "strategic_plans_status_idx" ON "strategic_plans"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_snapshots_code_key" ON "strategic_snapshots"("code" ASC);

-- CreateIndex
CREATE INDEX "strategic_snapshots_period_idx" ON "strategic_snapshots"("period" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategy_mandates_code_key" ON "strategy_mandates"("code" ASC);

-- CreateIndex
CREATE INDEX "strategy_mandates_status_idx" ON "strategy_mandates"("status" ASC);

-- CreateIndex
CREATE INDEX "strategy_meetings_period_idx" ON "strategy_meetings"("period" ASC);

-- CreateIndex
CREATE INDEX "strategy_one_pager_revisions_one_pager_id_created_at_idx" ON "strategy_one_pager_revisions"("one_pager_id" ASC, "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "strategy_one_pagers_slug_key" ON "strategy_one_pagers"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "strategy_patterns_snapshot_id_key" ON "strategy_patterns"("snapshot_id" ASC);

-- CreateIndex
CREATE INDEX "tech_signal_records_period_urgency_idx" ON "tech_signal_records"("period" ASC, "urgency" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "twelve_dim_scores_period_dim_id_key" ON "twelve_dim_scores"("period" ASC, "dim_id" ASC);

-- CreateIndex
CREATE INDEX "usage_logs_action_idx" ON "usage_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "usage_logs_created_at_idx" ON "usage_logs"("created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- CreateIndex
CREATE INDEX "users_org_unit_id_idx" ON "users"("org_unit_id" ASC);

-- CreateIndex
CREATE INDEX "win_loss_records_competitor_id_outcome_idx" ON "win_loss_records"("competitor_id" ASC, "outcome" ASC);

-- CreateIndex
CREATE INDEX "win_loss_records_product_line_id_idx" ON "win_loss_records"("product_line_id" ASC);

-- CreateIndex
CREATE INDEX "win_loss_records_region_id_outcome_idx" ON "win_loss_records"("region_id" ASC, "outcome" ASC);

-- CreateIndex
CREATE INDEX "working_versions_period_status_idx" ON "working_versions"("period" ASC, "status" ASC);

-- AddForeignKey
ALTER TABLE "_ProductBetLines" ADD CONSTRAINT "_ProductBetLines_A_fkey" FOREIGN KEY ("A") REFERENCES "product_bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductBetLines" ADD CONSTRAINT "_ProductBetLines_B_fkey" FOREIGN KEY ("B") REFERENCES "product_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assumptions" ADD CONSTRAINT "assumptions_linked_project_id_fkey" FOREIGN KEY ("linked_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battlecards" ADD CONSTRAINT "battlecards_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitor_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_channel_cells" ADD CONSTRAINT "brand_channel_cells_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_strategy_cards" ADD CONSTRAINT "brand_strategy_cards_working_version_id_fkey" FOREIGN KEY ("working_version_id") REFERENCES "working_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_snapshots" ADD CONSTRAINT "capacity_snapshots_linked_investment_case_id_fkey" FOREIGN KEY ("linked_investment_case_id") REFERENCES "investment_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_milestones" ADD CONSTRAINT "compass_milestones_north_star_id_fkey" FOREIGN KEY ("north_star_id") REFERENCES "company_north_stars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_premise_audits" ADD CONSTRAINT "compass_premise_audits_north_star_id_fkey" FOREIGN KEY ("north_star_id") REFERENCES "company_north_stars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_cells" ADD CONSTRAINT "competitive_cells_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitor_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_cells" ADD CONSTRAINT "competitive_cells_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "mkt_product_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_cells" ADD CONSTRAINT "competitive_cells_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "sales_regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_product_gaps" ADD CONSTRAINT "competitive_product_gaps_closure_vx_id_fkey" FOREIGN KEY ("closure_vx_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_product_gaps" ADD CONSTRAINT "competitive_product_gaps_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_metric_points" ADD CONSTRAINT "competitor_metric_points_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "competitor_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_products" ADD CONSTRAINT "competitor_products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "competitor_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_products" ADD CONSTRAINT "competitor_products_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "mkt_product_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diff_records" ADD CONSTRAINT "diff_records_from_snapshot_id_fkey" FOREIGN KEY ("from_snapshot_id") REFERENCES "strategic_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diff_records" ADD CONSTRAINT "diff_records_to_snapshot_id_fkey" FOREIGN KEY ("to_snapshot_id") REFERENCES "strategic_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fpa_budget_lines" ADD CONSTRAINT "fpa_budget_lines_fpa_period_id_fkey" FOREIGN KEY ("fpa_period_id") REFERENCES "fpa_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fpa_budget_lines" ADD CONSTRAINT "fpa_budget_lines_gtm_bet_id_fkey" FOREIGN KEY ("gtm_bet_id") REFERENCES "gtm_bets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fpa_budget_lines" ADD CONSTRAINT "fpa_budget_lines_investment_case_id_fkey" FOREIGN KEY ("investment_case_id") REFERENCES "investment_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fpa_budget_lines" ADD CONSTRAINT "fpa_budget_lines_product_bet_id_fkey" FOREIGN KEY ("product_bet_id") REFERENCES "product_bets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gtm_bets" ADD CONSTRAINT "gtm_bets_brand_channel_cell_id_fkey" FOREIGN KEY ("brand_channel_cell_id") REFERENCES "brand_channel_cells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gtm_bets" ADD CONSTRAINT "gtm_bets_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gtm_bets" ADD CONSTRAINT "gtm_bets_working_version_id_fkey" FOREIGN KEY ("working_version_id") REFERENCES "working_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_assertions" ADD CONSTRAINT "health_assertions_ceo_exception_by_id_fkey" FOREIGN KEY ("ceo_exception_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_assertions" ADD CONSTRAINT "health_assertions_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "strategic_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_assertions" ADD CONSTRAINT "health_assertions_source_report_id_fkey" FOREIGN KEY ("source_report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intel_signal_reviews" ADD CONSTRAINT "intel_signal_reviews_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "intel_signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intel_signals" ADD CONSTRAINT "intel_signals_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "intel_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_cases" ADD CONSTRAINT "investment_cases_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_cases" ADD CONSTRAINT "investment_cases_linked_vx_id_fkey" FOREIGN KEY ("linked_vx_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_cases" ADD CONSTRAINT "investment_cases_working_version_id_fkey" FOREIGN KEY ("working_version_id") REFERENCES "working_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jtbd_cards" ADD CONSTRAINT "jtbd_cards_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandate_holdings" ADD CONSTRAINT "mandate_holdings_mandate_id_fkey" FOREIGN KEY ("mandate_id") REFERENCES "strategy_mandates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandate_holdings" ADD CONSTRAINT "mandate_holdings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "strategy_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_poll_responses" ADD CONSTRAINT "meeting_poll_responses_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "meeting_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_polls" ADD CONSTRAINT "meeting_polls_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "strategy_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mkt_product_lines" ADD CONSTRAINT "mkt_product_lines_owner_org_id_fkey" FOREIGN KEY ("owner_org_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mkt_product_lines" ADD CONSTRAINT "mkt_product_lines_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "mkt_product_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "org_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_assumptions" ADD CONSTRAINT "plan_assumptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_attachments" ADD CONSTRAINT "plan_attachments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_initiatives" ADD CONSTRAINT "plan_initiatives_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_key_results" ADD CONSTRAINT "plan_key_results_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "plan_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_milestones" ADD CONSTRAINT "plan_milestones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_objectives" ADD CONSTRAINT "plan_objectives_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_premises" ADD CONSTRAINT "plan_premises_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bets" ADD CONSTRAINT "product_bets_linked_ic_id_fkey" FOREIGN KEY ("linked_ic_id") REFERENCES "investment_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bets" ADD CONSTRAINT "product_bets_working_version_id_fkey" FOREIGN KEY ("working_version_id") REFERENCES "working_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_roadmap_items" ADD CONSTRAINT "product_roadmap_items_linked_vx_id_fkey" FOREIGN KEY ("linked_vx_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_roadmap_items" ADD CONSTRAINT "product_roadmap_items_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_spec_dimensions" ADD CONSTRAINT "product_spec_dimensions_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "mkt_product_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_spec_values" ADD CONSTRAINT "product_spec_values_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "product_spec_dimensions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_spec_values" ADD CONSTRAINT "product_spec_values_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "competitor_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "competitor_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "competitive_cells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_owner_org_id_fkey" FOREIGN KEY ("owner_org_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_regions" ADD CONSTRAINT "sales_regions_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_regions" ADD CONSTRAINT "sales_regions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sales_regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_economics" ADD CONSTRAINT "segment_economics_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_diagnoses" ADD CONSTRAINT "strategic_diagnoses_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_diagnoses" ADD CONSTRAINT "strategic_diagnoses_working_version_id_fkey" FOREIGN KEY ("working_version_id") REFERENCES "working_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_snapshots" ADD CONSTRAINT "strategic_snapshots_cap_stack_period_id_fkey" FOREIGN KEY ("cap_stack_period_id") REFERENCES "cap_stack_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_snapshots" ADD CONSTRAINT "strategic_snapshots_cash_position_id_fkey" FOREIGN KEY ("cash_position_id") REFERENCES "cash_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_snapshots" ADD CONSTRAINT "strategic_snapshots_diagnosis_id_fkey" FOREIGN KEY ("diagnosis_id") REFERENCES "strategic_diagnoses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_snapshots" ADD CONSTRAINT "strategic_snapshots_frozen_by_id_fkey" FOREIGN KEY ("frozen_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_snapshots" ADD CONSTRAINT "strategic_snapshots_working_version_id_fkey" FOREIGN KEY ("working_version_id") REFERENCES "working_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_one_pager_revisions" ADD CONSTRAINT "strategy_one_pager_revisions_one_pager_id_fkey" FOREIGN KEY ("one_pager_id") REFERENCES "strategy_one_pagers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_patterns" ADD CONSTRAINT "strategy_patterns_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "strategic_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "win_loss_records" ADD CONSTRAINT "win_loss_records_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "competitive_cells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "win_loss_records" ADD CONSTRAINT "win_loss_records_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitor_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "win_loss_records" ADD CONSTRAINT "win_loss_records_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "sales_regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_versions" ADD CONSTRAINT "working_versions_based_on_snapshot_id_fkey" FOREIGN KEY ("based_on_snapshot_id") REFERENCES "strategic_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_versions" ADD CONSTRAINT "working_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

