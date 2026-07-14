-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense', 'cost', 'other');

-- CreateEnum
CREATE TYPE "LedgerStatement" AS ENUM ('bs', 'pl');

-- CreateEnum
CREATE TYPE "LedgerDrCr" AS ENUM ('dr', 'cr');

-- CreateEnum
CREATE TYPE "FinScenarioKind" AS ENUM ('actual', 'budget', 'mgmt_adj', 'forecast');

-- CreateEnum
CREATE TYPE "FinViewMode" AS ENUM ('periodic', 'ytd');

-- CreateEnum
CREATE TYPE "OpsMetricType" AS ENUM ('headcount', 'units_shipped', 'capex');

-- CreateEnum
CREATE TYPE "FinImportStatus" AS ENUM ('pending', 'imported', 'failed');

-- CreateEnum
CREATE TYPE "FinSourceType" AS ENUM ('account_map', 'dept_map', 'trial_balance', 'gl_detail', 'fact_entry', 'form_headcount', 'form_units', 'form_capex');

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "account_type" "LedgerAccountType" NOT NULL DEFAULT 'other',
    "statement" "LedgerStatement",
    "us_account_code" VARCHAR(30),
    "us_account_desc" VARCHAR(200),
    "consolidate_to" VARCHAR(30),
    "report_line" VARCHAR(120),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATE,
    "effective_to" DATE,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_departments" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "us_dept_code" VARCHAR(20),
    "us_dept_name" VARCHAR(100),
    "pl_level_code" VARCHAR(20),
    "pl_level_name" VARCHAR(100),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_tb_lines" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "as_of_date" DATE,
    "entity_code" VARCHAR(10) NOT NULL DEFAULT '590',
    "account_code" VARCHAR(30) NOT NULL,
    "account_id" TEXT,
    "dim1" VARCHAR(10),
    "dim2" VARCHAR(10),
    "dim3" VARCHAR(10),
    "dim4" VARCHAR(10),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CNY',
    "opening" DECIMAL(16,2),
    "debit" DECIMAL(16,2),
    "credit" DECIMAL(16,2),
    "closing" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "ledger_tb_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_gl_lines" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "entry_date" DATE,
    "journal_no" VARCHAR(30),
    "entity_code" VARCHAR(10) NOT NULL DEFAULT '590',
    "account_code" VARCHAR(30) NOT NULL,
    "account_id" TEXT,
    "dim1" VARCHAR(10),
    "dim2" VARCHAR(10),
    "dim3" VARCHAR(10),
    "dim4" VARCHAR(10),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CNY',
    "drcr" "LedgerDrCr" NOT NULL DEFAULT 'dr',
    "amount" DECIMAL(16,2) NOT NULL,
    "memo" VARCHAR(300),

    CONSTRAINT "ledger_gl_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_scenarios" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "kind" "FinScenarioKind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_fact_entries" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "entity_code" VARCHAR(10) NOT NULL DEFAULT '5RC',
    "account_code" VARCHAR(30),
    "metric_code" VARCHAR(50),
    "dept_code" VARCHAR(20),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "view_mode" "FinViewMode" NOT NULL DEFAULT 'periodic',
    "amount" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "fin_fact_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_metric_facts" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "metric_type" "OpsMetricType" NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "dim1" VARCHAR(100),
    "dim2" VARCHAR(100),
    "value" DECIMAL(16,2) NOT NULL,
    "unit" VARCHAR(20),

    CONSTRAINT "ops_metric_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_import_batches" (
    "id" TEXT NOT NULL,
    "source_type" "FinSourceType" NOT NULL,
    "file_name" VARCHAR(300) NOT NULL,
    "sheet_name" VARCHAR(100),
    "period" VARCHAR(10),
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "status" "FinImportStatus" NOT NULL DEFAULT 'pending',
    "error_text" VARCHAR(500),
    "content_hash" VARCHAR(64),
    "imported_by" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_code_key" ON "ledger_accounts"("code");

-- CreateIndex
CREATE INDEX "ledger_accounts_us_account_code_idx" ON "ledger_accounts"("us_account_code");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_departments_code_key" ON "ledger_departments"("code");

-- CreateIndex
CREATE INDEX "ledger_departments_us_dept_code_idx" ON "ledger_departments"("us_dept_code");

-- CreateIndex
CREATE INDEX "ledger_tb_lines_period_account_code_idx" ON "ledger_tb_lines"("period", "account_code");

-- CreateIndex
CREATE INDEX "ledger_tb_lines_batch_id_idx" ON "ledger_tb_lines"("batch_id");

-- CreateIndex
CREATE INDEX "ledger_gl_lines_period_account_code_idx" ON "ledger_gl_lines"("period", "account_code");

-- CreateIndex
CREATE INDEX "ledger_gl_lines_batch_id_idx" ON "ledger_gl_lines"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "fin_scenarios_code_key" ON "fin_scenarios"("code");

-- CreateIndex
CREATE INDEX "fin_fact_entries_period_scenario_id_idx" ON "fin_fact_entries"("period", "scenario_id");

-- CreateIndex
CREATE INDEX "fin_fact_entries_account_code_idx" ON "fin_fact_entries"("account_code");

-- CreateIndex
CREATE INDEX "fin_fact_entries_batch_id_idx" ON "fin_fact_entries"("batch_id");

-- CreateIndex
CREATE INDEX "ops_metric_facts_metric_type_period_idx" ON "ops_metric_facts"("metric_type", "period");

-- CreateIndex
CREATE INDEX "ops_metric_facts_batch_id_idx" ON "ops_metric_facts"("batch_id");

-- CreateIndex
CREATE INDEX "fin_import_batches_source_type_period_idx" ON "fin_import_batches"("source_type", "period");

-- AddForeignKey
ALTER TABLE "ledger_tb_lines" ADD CONSTRAINT "ledger_tb_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_tb_lines" ADD CONSTRAINT "ledger_tb_lines_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "fin_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_gl_lines" ADD CONSTRAINT "ledger_gl_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_gl_lines" ADD CONSTRAINT "ledger_gl_lines_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "fin_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_fact_entries" ADD CONSTRAINT "fin_fact_entries_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "fin_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_fact_entries" ADD CONSTRAINT "fin_fact_entries_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "fin_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_metric_facts" ADD CONSTRAINT "ops_metric_facts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "fin_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
