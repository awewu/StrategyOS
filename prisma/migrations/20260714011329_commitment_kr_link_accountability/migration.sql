-- AlterTable
ALTER TABLE "commitments" ADD COLUMN     "linked_kr_id" TEXT;

-- AlterTable
ALTER TABLE "strategy_meetings" ADD COLUMN     "plan_id" TEXT;

-- CreateTable
CREATE TABLE "accountability_records" (
    "id" TEXT NOT NULL,
    "source_kind" VARCHAR(20) NOT NULL,
    "dimension" "BscDimension",
    "owner_name" VARCHAR(50),
    "linked_kr_id" TEXT,
    "culture_general_ref" VARCHAR(50),
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accountability_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_org_scopes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_unit_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_org_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT,
    "participant_name" VARCHAR(50) NOT NULL,
    "participant_role" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_todos" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "owner_user_id" TEXT,
    "owner_name" VARCHAR(50),
    "due_date" DATE,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accountability_records_active_idx" ON "accountability_records"("active");

-- CreateIndex
CREATE INDEX "user_org_scopes_org_unit_id_idx" ON "user_org_scopes"("org_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_org_scopes_user_id_org_unit_id_key" ON "user_org_scopes"("user_id", "org_unit_id");

-- CreateIndex
CREATE INDEX "meeting_participants_meeting_id_idx" ON "meeting_participants"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_participants_user_id_idx" ON "meeting_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_meeting_id_user_id_key" ON "meeting_participants"("meeting_id", "user_id");

-- CreateIndex
CREATE INDEX "meeting_todos_meeting_id_completed_idx" ON "meeting_todos"("meeting_id", "completed");

-- CreateIndex
CREATE INDEX "meeting_todos_owner_user_id_idx" ON "meeting_todos"("owner_user_id");

-- CreateIndex
CREATE INDEX "commitments_linked_kr_id_idx" ON "commitments"("linked_kr_id");

-- CreateIndex
CREATE INDEX "strategy_meetings_plan_id_idx" ON "strategy_meetings"("plan_id");

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_linked_kr_id_fkey" FOREIGN KEY ("linked_kr_id") REFERENCES "key_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_scopes" ADD CONSTRAINT "user_org_scopes_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_scopes" ADD CONSTRAINT "user_org_scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_meetings" ADD CONSTRAINT "strategy_meetings_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "strategy_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_todos" ADD CONSTRAINT "meeting_todos_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "strategy_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_todos" ADD CONSTRAINT "meeting_todos_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
