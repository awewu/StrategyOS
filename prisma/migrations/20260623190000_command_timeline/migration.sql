-- AlterTable
ALTER TABLE "strategic_command_configs" ALTER COLUMN "decisions_json" DROP NOT NULL;

-- AlterTable
ALTER TABLE "strategic_command_configs" ADD COLUMN "timeline_json" JSONB;
