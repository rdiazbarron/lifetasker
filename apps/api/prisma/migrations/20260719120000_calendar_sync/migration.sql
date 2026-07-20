-- Google Calendar sync (#35): one-way, best-effort, completion-only.
--
-- Adds the per-completion sync state and the cached id of each connected
-- account's dedicated "LifeTasker" calendar. Nothing here backfills history:
-- existing completions stay NOT_APPLICABLE (they predate the integration and
-- were never synced), which is exactly how an unconnected user's rows look.

-- Sync status for a completion. Default NOT_APPLICABLE so every existing row —
-- and every future completion by an unconnected user — needs no write.
CREATE TYPE "CalendarSyncStatus" AS ENUM ('NOT_APPLICABLE', 'SYNCED', 'PENDING');

ALTER TABLE "BlockInstance"
  ADD COLUMN "calendarSyncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN "googleEventId" TEXT;

-- #36 retries scan for PENDING rows; keep that lookup cheap.
CREATE INDEX "BlockInstance_calendarSyncStatus_idx" ON "BlockInstance"("calendarSyncStatus");

-- Cached id of the dedicated "LifeTasker" calendar, created once per connected
-- Google account and remembered. Better Auth owns this table but never reads
-- this column.
ALTER TABLE "Account" ADD COLUMN "calendarId" TEXT;
