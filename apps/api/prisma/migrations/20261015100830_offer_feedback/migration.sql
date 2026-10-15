-- Feedback module: Feedback given without being asked — Offered Feedback (#29). Such Feedback
-- has no Feedback Request and no Ask, so both ids become nullable, and it carries its own
-- Topic and Visibility, so every row now holds them — with the people selected — rather than
-- reading them back through the request. Existing rows are all answers to an Ask: they are
-- backfilled as REQUESTED with their request's Topic, Visibility and selected people, none of
-- which change after sending, so the copy cannot drift. The CHECK holds what Prisma cannot declare: an answer names its request and Ask, and
-- Offered Feedback names neither.
-- Every table touched is Feedback's own (BE_03 R7); "feedback_selected_person" holds Account ids
-- with no foreign key out of the module.
-- Rollback: DELETE FROM "feedback" WHERE "origin" = 'OFFERED'; DROP TABLE "feedback_selected_person";
-- ALTER TABLE "feedback" DROP CONSTRAINT "feedback_origin_check", DROP COLUMN "origin",
-- DROP COLUMN "topic", DROP COLUMN "visibility", ALTER COLUMN "feedbackRequestId" SET NOT NULL,
-- ALTER COLUMN "feedbackAskId" SET NOT NULL; DROP TYPE "FeedbackOrigin";

-- CreateEnum
CREATE TYPE "FeedbackOrigin" AS ENUM ('REQUESTED', 'OFFERED');

-- AlterTable: added nullable, backfilled, then required.
ALTER TABLE "feedback" ADD COLUMN "origin" "FeedbackOrigin",
ADD COLUMN "topic" TEXT,
ADD COLUMN "visibility" "Visibility",
ALTER COLUMN "feedbackRequestId" DROP NOT NULL,
ALTER COLUMN "feedbackAskId" DROP NOT NULL;

UPDATE "feedback" AS f
SET "origin" = 'REQUESTED',
    "topic" = r."topic",
    "visibility" = r."visibility"
FROM "feedback_request" AS r
WHERE r."id" = f."feedbackRequestId";

ALTER TABLE "feedback" ALTER COLUMN "origin" SET NOT NULL,
ALTER COLUMN "topic" SET NOT NULL,
ALTER COLUMN "visibility" SET NOT NULL;

ALTER TABLE "feedback" ADD CONSTRAINT "feedback_origin_check" CHECK (
  ("origin" = 'REQUESTED' AND "feedbackRequestId" IS NOT NULL AND "feedbackAskId" IS NOT NULL)
  OR ("origin" = 'OFFERED' AND "feedbackRequestId" IS NULL AND "feedbackAskId" IS NULL)
);

-- CreateTable
CREATE TABLE "feedback_selected_person" (
    "feedbackId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "feedback_selected_person_pkey" PRIMARY KEY ("feedbackId","accountId")
);

-- AddForeignKey
ALTER TABLE "feedback_selected_person" ADD CONSTRAINT "feedback_selected_person_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: each existing answer reads as the request it answers chose.
INSERT INTO "feedback_selected_person" ("feedbackId", "accountId")
SELECT f."id", p."accountId"
FROM "feedback" AS f
JOIN "feedback_request_selected_person" AS p ON p."feedbackRequestId" = f."feedbackRequestId";
