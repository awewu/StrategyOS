-- AlterTable: tamper-evident audit hash chain
ALTER TABLE "usage_logs" ADD COLUMN "prev_hash" VARCHAR(64);
ALTER TABLE "usage_logs" ADD COLUMN "hash" VARCHAR(64);
