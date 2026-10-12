-- Feedback module: one Giver's answer to one Ask (#24). A new table only; no existing row
-- changes, and no Ask has ever left PENDING, so nothing needs unwinding. The one foreign key
-- stays inside this module (BE_03 R7): the Workspace and the Accounts are plain ids.
-- The unique index on "feedbackAskId" is the rule "an Ask is answered once" — it is what
-- refuses a second answer when two requests race, which no check in the application can do.
-- Rollback: DROP TABLE "feedback";
-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "feedbackRequestId" TEXT NOT NULL,
    "feedbackAskId" TEXT NOT NULL,
    "giverAccountId" TEXT NOT NULL,
    "receiverAccountId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_feedbackAskId_key" ON "feedback"("feedbackAskId");

-- CreateIndex
CREATE INDEX "feedback_workspaceId_receiverAccountId_createdAt_idx" ON "feedback"("workspaceId", "receiverAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_workspaceId_giverAccountId_createdAt_idx" ON "feedback"("workspaceId", "giverAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_feedbackAskId_fkey" FOREIGN KEY ("feedbackAskId") REFERENCES "feedback_ask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
