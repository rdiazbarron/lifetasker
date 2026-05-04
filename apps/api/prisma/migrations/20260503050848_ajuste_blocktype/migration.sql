-- Add missing duration column for BlockType.
-- This migration runs before the follow-up adjustment migration.
ALTER TABLE "BlockType"
ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER NOT NULL DEFAULT 30;
