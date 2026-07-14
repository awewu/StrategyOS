-- 指标期次快照表：兑现率 / Robust 等指标每期落一行，攒跨期趋势
CREATE TABLE "metric_snapshots" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "metric_key" VARCHAR(40) NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "metadata" JSONB,
    "captured_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "metric_snapshots_period_metric_key_key" ON "metric_snapshots"("period", "metric_key");

CREATE INDEX "metric_snapshots_metric_key_idx" ON "metric_snapshots"("metric_key");
