-- Strategic capital config (real options + post-invest deviations)
CREATE TABLE "strategic_capital_configs" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "real_options_json" JSONB NOT NULL,
    "post_invest_deviations_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_capital_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "strategic_capital_configs_period_key" ON "strategic_capital_configs"("period");

-- Culture handbook (doctrines, four satisfactions, behavior guidelines)
CREATE TABLE "culture_handbooks" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "content_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culture_handbooks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "culture_handbooks_period_key" ON "culture_handbooks"("period");
