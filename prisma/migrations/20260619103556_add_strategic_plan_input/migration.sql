-- CreateEnum
CREATE TYPE "OrgLevel" AS ENUM ('GROUP', 'EXECUTIVE', 'OPERATING_UNIT');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "BscDimension" AS ENUM ('FINANCIAL', 'CUSTOMER', 'PROCESS', 'LEARNING');

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
    CONSTRAINT "strategic_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_objectives" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "dimension" "BscDimension" NOT NULL,
    "objective" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_key_results" (
    "id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "key_result" VARCHAR(300) NOT NULL,
    "target" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_key_results_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "plan_assumptions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "assumption" TEXT NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "org_units_level_sort_order_idx" ON "org_units"("level", "sort_order");
CREATE INDEX "org_units_parent_id_idx" ON "org_units"("parent_id");

-- CreateIndex
CREATE INDEX "strategic_plans_status_idx" ON "strategic_plans"("status");
CREATE UNIQUE INDEX "strategic_plans_org_unit_id_horizon_start_horizon_end_key" ON "strategic_plans"("org_unit_id", "horizon_start", "horizon_end");

-- CreateIndex
CREATE INDEX "plan_objectives_plan_id_dimension_idx" ON "plan_objectives"("plan_id", "dimension");

-- CreateIndex
CREATE INDEX "plan_key_results_objective_id_idx" ON "plan_key_results"("objective_id");

-- CreateIndex
CREATE INDEX "plan_initiatives_plan_id_idx" ON "plan_initiatives"("plan_id");

-- CreateIndex
CREATE INDEX "resource_requests_plan_id_idx" ON "resource_requests"("plan_id");

-- CreateIndex
CREATE INDEX "plan_assumptions_plan_id_idx" ON "plan_assumptions"("plan_id");

-- AddForeignKey
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "org_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_objectives" ADD CONSTRAINT "plan_objectives_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_key_results" ADD CONSTRAINT "plan_key_results_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "plan_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_initiatives" ADD CONSTRAINT "plan_initiatives_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_assumptions" ADD CONSTRAINT "plan_assumptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
