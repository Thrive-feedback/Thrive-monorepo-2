-- When a topic was put on the agenda, so a topic written for a meeting day that was then skipped
-- can say so. Expand only (BE_15): a new column with a default; existing topics read as added now.
ALTER TABLE "one_on_one_topic" ADD COLUMN "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
