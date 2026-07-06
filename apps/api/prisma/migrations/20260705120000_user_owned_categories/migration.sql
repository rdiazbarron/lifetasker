-- User-owned categories: fork the previously-global Category table so each user
-- owns their own categories, and add per-category weight + color.
--
-- Categories were global reference data (unique `key`, no owner) shared by every
-- user through their block types. This migration clones each category a user
-- actually references into a user-owned copy, repoints that user's block types
-- at the copy (preserving the BlockType.categoryId FK), then drops the original
-- unowned rows.
--
-- Reversibility: the schema changes are reversible, but the data fork is not
-- fully so — unreferenced shared categories are dropped and per-user copies
-- replace the shared originals. Restore from a backup if a rollback is needed.

-- 1. Add the new columns. userId is nullable for now so existing rows survive
--    the ALTER; it is tightened to NOT NULL in step 5 once every row is owned.
ALTER TABLE "Category"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "weightPercent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "color" TEXT NOT NULL DEFAULT '#6366f1';

-- 1b. Drop the global-key uniqueness up front: the per-user clones below
--     intentionally reuse the original `key`, which would collide with this
--     index. Per-user uniqueness is re-established in step 6.
DROP INDEX "Category_key_key";

-- 2. Clone every (user, category) pair reachable from a block type into a new
--    user-owned category. A scratch table records original -> clone so the FK
--    repoint in step 3 can locate each user's copy.
CREATE TEMP TABLE "_category_fork" ON COMMIT DROP AS
SELECT DISTINCT
  bt."userId"             AS "userId",
  c."id"                  AS "originalId",
  gen_random_uuid()::text AS "newId",
  c."key"                 AS "key",
  c."name"                AS "name"
FROM "BlockType" bt
JOIN "Category" c ON c."id" = bt."categoryId";

INSERT INTO "Category" ("id", "userId", "key", "name", "weightPercent", "color", "createdAt", "updatedAt")
SELECT f."newId", f."userId", f."key", f."name", 0, '#6366f1', now(), now()
FROM "_category_fork" f;

-- 3. Repoint each user's block types from the shared original to their clone.
UPDATE "BlockType" bt
SET "categoryId" = f."newId"
FROM "_category_fork" f
WHERE bt."userId" = f."userId"
  AND bt."categoryId" = f."originalId";

-- 4. Drop the now-unreferenced shared originals (userId still NULL).
DELETE FROM "Category" WHERE "userId" IS NULL;

-- 5. Every remaining row is owned; enforce it.
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;

-- 6. Establish per-user key uniqueness, index the owner, and wire the FK to
--    User (cascade so deleting a user removes their categories).
CREATE UNIQUE INDEX "Category_userId_key_key" ON "Category"("userId", "key");
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
ALTER TABLE "Category"
  ADD CONSTRAINT "Category_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
