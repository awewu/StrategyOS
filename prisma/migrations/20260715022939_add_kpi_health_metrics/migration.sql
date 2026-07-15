-- CreateTable
CREATE TABLE "kpi_health_metrics" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "scope" "FpaScope" NOT NULL DEFAULT 'company',
    "brand_code" "BrandCode",
    "name" VARCHAR(80) NOT NULL,
    "category" VARCHAR(40),
    "unit" VARCHAR(16) NOT NULL DEFAULT 'percent',
    "current_value" DECIMAL(18,4),
    "target_value" DECIMAL(18,4),
    "prior_year_value" DECIMAL(18,4),
    "qtd_value" DECIMAL(18,4),
    "ytd_value" DECIMAL(18,4),
    "full_year_value" DECIMAL(18,4),
    "higher_is_better" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kpi_health_metrics_period_scope_idx" ON "kpi_health_metrics"("period", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_health_metrics_period_scope_brand_code_name_key" ON "kpi_health_metrics"("period", "scope", "brand_code", "name");
