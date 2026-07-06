-- Store points on each completion (frozen scoring).
--
-- Points are computed once at completion time from the block's duration and its
-- category weight, then never recomputed. This migration adds the column and
-- backfills existing completions.
--
-- Backfill caveat: historical completions have no record of the weight in
-- effect when they happened, so they are scored with the CURRENT category
-- weight. This is the single documented place where "frozen history" is
-- approximate (see issue #25). The formula mirrors progress/points-calculator.ts:
--   points = round( (durationMinutes / 15) * (1 + weightPercent / 100) )

ALTER TABLE "BlockInstance" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;

UPDATE "BlockInstance" bi
SET "points" = ROUND(
  (bt."durationMinutes"::numeric / 15) * (1 + c."weightPercent"::numeric / 100)
)
FROM "BlockType" bt
JOIN "Category" c ON c."id" = bt."categoryId"
WHERE bi."blockTypeId" = bt."id";
