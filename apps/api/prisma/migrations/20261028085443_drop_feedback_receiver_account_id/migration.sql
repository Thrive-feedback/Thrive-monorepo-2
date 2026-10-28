-- The contract half of ADR 0061: `feedback.receiverAccountId` and its index go. Every read has
-- gone through `feedback_receiver` since `add_feedback_receiver`, and the code in this change no
-- longer writes the column, so nothing reads or writes it.
--
-- Existing rows: nothing is lost. Every piece of Feedback has had all its Receivers in
-- `feedback_receiver` since `add_feedback_receiver` copied them there, and the column only ever
-- held the first of them. Dropping a column and an index takes a brief lock on `feedback` and
-- rewrites no rows.
--
-- Deploy: this ships in the same change as the code that stopped writing the column, not in a
-- change of its own after it (a deliberate exception to BE_15 R10). Run it only once no API on
-- the old code is still serving: the old code still names the column when it writes Feedback, so
-- giving or answering Feedback would fail until it stops.
--
-- Rollback (the column comes back from each piece's first Receiver):
--   ALTER TABLE "feedback" ADD COLUMN "receiverAccountId" TEXT;
--   UPDATE "feedback" f SET "receiverAccountId" = r."accountId"
--     FROM "feedback_receiver" r WHERE r."feedbackId" = f."id" AND r."position" = 0;
--   ALTER TABLE "feedback" ALTER COLUMN "receiverAccountId" SET NOT NULL;
--   CREATE INDEX "feedback_workspaceId_receiverAccountId_createdAt_idx"
--     ON "feedback"("workspaceId", "receiverAccountId", "createdAt");

-- DropIndex
DROP INDEX "feedback_workspaceId_receiverAccountId_createdAt_idx";

-- AlterTable
ALTER TABLE "feedback" DROP COLUMN "receiverAccountId";
