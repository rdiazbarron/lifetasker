-- Soft-delete for block types. See schema.prisma BlockType.archivedAt.
ALTER TABLE "BlockType" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Active-vs-archived lookups per user (findAll filters on archivedAt IS NULL).
CREATE INDEX "BlockType_userId_archivedAt_idx" ON "BlockType"("userId", "archivedAt");
