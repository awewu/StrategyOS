-- CreateTable
CREATE TABLE "rationality_verdicts" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "targetKind" VARCHAR(20) NOT NULL,
    "target_code" VARCHAR(40),
    "target_label" VARCHAR(500),
    "ai_recommendation" VARCHAR(20),
    "ai_rationale" VARCHAR(2000),
    "ai_model" VARCHAR(60),
    "ai_generated_at" TIMESTAMP(3),
    "human_decision" VARCHAR(20),
    "human_rationale" VARCHAR(2000),
    "decided_by" VARCHAR(100),
    "decided_at" TIMESTAMP(3),
    "governance_ref" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rationality_verdicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rationality_verdicts_period_targetKind_idx" ON "rationality_verdicts"("period", "targetKind");
