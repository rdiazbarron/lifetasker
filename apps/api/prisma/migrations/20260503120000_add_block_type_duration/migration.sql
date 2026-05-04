-- Keep durationMinutes required but remove default to match Prisma schema.
ALTER TABLE "BlockType"
ALTER COLUMN "durationMinutes" DROP DEFAULT;
