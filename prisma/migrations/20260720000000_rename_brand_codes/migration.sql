-- Rename BrandCode enum values from pinyin/placeholder to canonical English brand codes.
-- HENGRE -> EVERHOT (恒热), RUIMEI -> RHEEM (瑞美), TECH_HOME -> AUQAHART (Auqahart, hydraulic new category).
-- RUUD unchanged. Rename preserves all existing rows and constraints (no value drop needed).
-- Idempotent: each rename only runs if the old value still exists and the new value does not.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'BrandCode' AND e.enumlabel = 'HENGRE'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'BrandCode' AND e.enumlabel = 'EVERHOT'
  ) THEN
    ALTER TYPE "BrandCode" RENAME VALUE 'HENGRE' TO 'EVERHOT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'BrandCode' AND e.enumlabel = 'RUIMEI'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'BrandCode' AND e.enumlabel = 'RHEEM'
  ) THEN
    ALTER TYPE "BrandCode" RENAME VALUE 'RUIMEI' TO 'RHEEM';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'BrandCode' AND e.enumlabel = 'TECH_HOME'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'BrandCode' AND e.enumlabel = 'AUQAHART'
  ) THEN
    ALTER TYPE "BrandCode" RENAME VALUE 'TECH_HOME' TO 'AUQAHART';
  END IF;
END$$;
