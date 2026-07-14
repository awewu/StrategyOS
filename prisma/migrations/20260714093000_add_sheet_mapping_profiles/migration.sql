-- 导入管道 T4-P1：Sheet 列映射画像（一次配置长期复用）
CREATE TABLE "sheet_mapping_profiles" (
    "id" TEXT NOT NULL,
    "sheet_type" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "column_map" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_mapping_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sheet_mapping_profiles_sheet_type_name_key" ON "sheet_mapping_profiles"("sheet_type", "name");
