-- Feedback module: a piece of Feedback no longer holds a Topic (brain ADR-0039). Offered
-- Feedback is only its Feedback message, and Requested Feedback no longer copies the request's
-- text, which stays on "feedback_request"."message". This step is destructive and so is kept
-- apart from the rename (BE_15 R10). Thrive is pre-launch with no deployment, so no reader still
-- needs the column. Every row loses its copy. A Requested answer's original still lives on its
-- request, and an Offered one's is gone.
-- Rollback: ALTER TABLE "feedback" ADD COLUMN "topic" TEXT; UPDATE "feedback" AS f SET "topic" =
-- r."message" FROM "feedback_request" AS r WHERE r."id" = f."feedbackRequestId"; UPDATE
-- "feedback" SET "topic" = '' WHERE "topic" IS NULL; ALTER TABLE "feedback" ALTER COLUMN "topic"
-- SET NOT NULL;

-- AlterTable
ALTER TABLE "feedback" DROP COLUMN "topic";
