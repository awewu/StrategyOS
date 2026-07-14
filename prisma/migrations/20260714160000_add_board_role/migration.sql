-- Add board role to UserRole enum (additive, safe)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'board';
