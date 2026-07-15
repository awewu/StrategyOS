-- AlterEnum
ALTER TYPE "FinSourceType" ADD VALUE 'manual_ops';
ALTER TYPE "FinSourceType" ADD VALUE 'manual_pvi';

-- CreateEnum
CREATE TYPE "FinEditTarget" AS ENUM ('ops_metric', 'pvi_sales');

-- CreateEnum
CREATE TYPE "FinEditStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "fin_edit_proposals" (
    "id" TEXT NOT NULL,
    "target" "FinEditTarget" NOT NULL,
    "period" VARCHAR(10),
    "title" VARCHAR(200) NOT NULL,
    "status" "FinEditStatus" NOT NULL DEFAULT 'draft',
    "changes_json" JSONB NOT NULL,
    "note" VARCHAR(500),
    "created_by" VARCHAR(100),
    "submitted_at" TIMESTAMP(3),
    "submitted_by" VARCHAR(100),
    "decided_at" TIMESTAMP(3),
    "decided_by" VARCHAR(100),
    "decision_note" VARCHAR(500),
    "applied_batch_id" VARCHAR(40),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_edit_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fin_edit_proposals_target_status_idx" ON "fin_edit_proposals"("target", "status");
