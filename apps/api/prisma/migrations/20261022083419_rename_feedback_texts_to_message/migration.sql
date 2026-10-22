-- Feedback module: Topic is retired (brain ADR-0039). What a Requester writes is a Request
-- message, and what a Giver writes is a Feedback message, so both columns are renamed to
-- "message". RENAME keeps every row's text as it was. The Prisma default here would have been
-- DROP and ADD, which loses it. Both tables are Feedback's own (BE_03 R7).
-- Rollback: ALTER TABLE "feedback_request" RENAME COLUMN "message" TO "topic";
-- ALTER TABLE "feedback" RENAME COLUMN "message" TO "body";

-- AlterTable
ALTER TABLE "feedback_request" RENAME COLUMN "topic" TO "message";

-- AlterTable
ALTER TABLE "feedback" RENAME COLUMN "body" TO "message";
