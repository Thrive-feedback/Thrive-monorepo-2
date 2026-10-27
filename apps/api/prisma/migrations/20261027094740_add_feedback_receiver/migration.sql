-- Everyone a piece of Feedback is for, in a table of their own (brain `ADR-0044`, ADR 0061):
-- Offered Feedback can now be given to several Members at once, and Requested Feedback keeps its
-- one Receiver, the Requester. `position` keeps the order the Giver chose them in.
--
-- Expand and migrate, not contract (BE_15 R5): `feedback.receiverAccountId` stays and keeps being
-- written with the first Receiver, so an API still running the old code during a deploy reads
-- what it always did. A later migration, in its own change, drops it (BE_15 R10).
--
-- Existing rows: every piece of Feedback already written gets its one Receiver here, at position
-- 0, copied from the column in the same transaction, so no read finds a piece with nobody to
-- receive it. The copy is one INSERT ... SELECT over the table, sized by the Feedback a few
-- Workspaces wrote, and takes no lock on `feedback` beyond the read.
-- Rollback: DROP TABLE "feedback_receiver"; — the column still holds every Receiver of
-- one-Receiver Feedback. Feedback given to several since would keep only its first Receiver.

-- CreateTable
CREATE TABLE "feedback_receiver" (
    "feedbackId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "feedback_receiver_pkey" PRIMARY KEY ("feedbackId","accountId")
);

-- CreateIndex
CREATE INDEX "feedback_receiver_accountId_idx" ON "feedback_receiver"("accountId");

-- AddForeignKey
ALTER TABLE "feedback_receiver" ADD CONSTRAINT "feedback_receiver_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing piece of Feedback has exactly one Receiver.
INSERT INTO "feedback_receiver" ("feedbackId", "accountId", "position")
SELECT "id", "receiverAccountId", 0 FROM "feedback";
