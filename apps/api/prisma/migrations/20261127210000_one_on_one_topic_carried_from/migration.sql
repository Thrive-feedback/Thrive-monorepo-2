-- The skipped meeting day a topic was written for, kept when the schedule changes. Expand only
-- (BE_15): a new nullable column; nothing else changes.
ALTER TABLE "one_on_one_topic" ADD COLUMN "carriedFrom" TEXT;
