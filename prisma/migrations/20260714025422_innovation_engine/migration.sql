-- CreateTable
CREATE TABLE "innovation_product_lines" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "lifecycle_stage" VARCHAR(20) NOT NULL DEFAULT 'introduction',
    "dominant_problems" TEXT[],
    "f_axis_weights" JSONB NOT NULL DEFAULT '{}',
    "gate_thresholds" JSONB NOT NULL DEFAULT '{}',
    "evidence_bar" INTEGER NOT NULL DEFAULT 4,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "innovation_product_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "innovation_bets" (
    "id" TEXT NOT NULL,
    "line_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "horizon" VARCHAR(4) NOT NULL DEFAULT 'H2',
    "stage_gate" VARCHAR(20) NOT NULL DEFAULT 'discovery',
    "next_commit_amount" DECIMAL(14,2),
    "abandon_right" BOOLEAN NOT NULL DEFAULT true,
    "odi" JSONB NOT NULL DEFAULT '[]',
    "wtp_factor" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "feasibility_dims" JSONB NOT NULL DEFAULT '[]',
    "economics" JSONB NOT NULL DEFAULT '{}',
    "capability_gaps" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "innovation_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "innovation_claims" (
    "id" TEXT NOT NULL,
    "bet_id" TEXT NOT NULL,
    "axis" VARCHAR(2) NOT NULL,
    "claim" VARCHAR(500) NOT NULL,
    "warrant" VARCHAR(500),
    "rebuttal" VARCHAR(500),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "innovation_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "innovation_evidence" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "source" VARCHAR(300) NOT NULL,
    "note" VARCHAR(500),
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "innovation_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "innovation_assumptions" (
    "id" TEXT NOT NULL,
    "bet_id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "statement" VARCHAR(500) NOT NULL,
    "status" VARCHAR(12) NOT NULL DEFAULT 'pending',
    "test_plan" VARCHAR(500),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "innovation_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "innovation_bets_line_id_idx" ON "innovation_bets"("line_id");

-- CreateIndex
CREATE INDEX "innovation_claims_bet_id_idx" ON "innovation_claims"("bet_id");

-- CreateIndex
CREATE INDEX "innovation_evidence_claim_id_idx" ON "innovation_evidence"("claim_id");

-- CreateIndex
CREATE INDEX "innovation_assumptions_bet_id_idx" ON "innovation_assumptions"("bet_id");

-- AddForeignKey
ALTER TABLE "innovation_bets" ADD CONSTRAINT "innovation_bets_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "innovation_product_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innovation_claims" ADD CONSTRAINT "innovation_claims_bet_id_fkey" FOREIGN KEY ("bet_id") REFERENCES "innovation_bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innovation_evidence" ADD CONSTRAINT "innovation_evidence_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "innovation_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innovation_assumptions" ADD CONSTRAINT "innovation_assumptions_bet_id_fkey" FOREIGN KEY ("bet_id") REFERENCES "innovation_bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
