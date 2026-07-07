-- Store immutable organization-level strategy submissions for version comparison.

CREATE TABLE "plan_submission_snapshots" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "org_unit_id" TEXT NOT NULL,
    "horizon_start" INTEGER NOT NULL,
    "horizon_end" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by_id" TEXT,
    "snapshot_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_submission_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_submission_snapshots_org_unit_id_horizon_start_horizon_end_version_key"
  ON "plan_submission_snapshots"("org_unit_id", "horizon_start", "horizon_end", "version");

CREATE INDEX "plan_submission_snapshots_org_unit_id_horizon_start_horizon_end_submitted_at_idx"
  ON "plan_submission_snapshots"("org_unit_id", "horizon_start", "horizon_end", "submitted_at");

CREATE INDEX "plan_submission_snapshots_plan_id_idx"
  ON "plan_submission_snapshots"("plan_id");

ALTER TABLE "plan_submission_snapshots"
  ADD CONSTRAINT "plan_submission_snapshots_org_unit_id_fkey"
  FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_submission_snapshots"
  ADD CONSTRAINT "plan_submission_snapshots_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
