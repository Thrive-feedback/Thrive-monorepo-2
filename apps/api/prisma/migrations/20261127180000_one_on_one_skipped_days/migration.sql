-- The meeting days skipped under a schedule since changed or ended. Expand only (BE_15): a new
-- column with a default, read and written by the same release; nothing else changes.
ALTER TABLE "one_on_one" ADD COLUMN "skippedDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
