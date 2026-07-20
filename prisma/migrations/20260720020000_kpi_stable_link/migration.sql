-- Stable KPI linkage (P1-1): connect plan KRs to actual KPI signals by a stable code,
-- and let health-signal KPI rows declare their BSC dimension.
-- Fixes the latent bug where KPI rows stored with dimension='kpi' were never matched
-- to a BSC dimension, so command-deck leading-KR "actual" was always empty.
-- Idempotent: only adds columns if they do not already exist. Backward compatible (nullable).

ALTER TABLE "plan_key_results" ADD COLUMN IF NOT EXISTS "kpi_code" VARCHAR(40);
ALTER TABLE "health_signals" ADD COLUMN IF NOT EXISTS "kpi_code" VARCHAR(40);
ALTER TABLE "health_signals" ADD COLUMN IF NOT EXISTS "bsc_dimension" VARCHAR(20);
