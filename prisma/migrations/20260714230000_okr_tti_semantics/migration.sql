-- OKR TTI 语义升级：KR 改进三元组 baseline→target(current)，O 挂 Hoshin 承接链
ALTER TABLE "objectives" ADD COLUMN "intent" TEXT;
ALTER TABLE "objectives" ADD COLUMN "owner_name" VARCHAR(50);
ALTER TABLE "objectives" ADD COLUMN "hoshin_entry_id" TEXT;
ALTER TABLE "objectives" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "key_results" ADD COLUMN "baseline_value" VARCHAR(50);
ALTER TABLE "key_results" ADD COLUMN "unit" VARCHAR(20);
