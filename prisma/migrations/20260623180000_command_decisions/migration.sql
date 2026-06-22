-- CreateTable
CREATE TABLE "strategic_command_configs" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL DEFAULT '2026-FY',
    "decisions_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_command_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategic_command_configs_period_key" ON "strategic_command_configs"("period");
