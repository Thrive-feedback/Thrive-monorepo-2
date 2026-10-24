-- Notifications module, its second table: one thing one Member is told about inside Thrive
-- (#248, design 0022). The row is a pointer and never a copy — an actor, a type and the id of the
-- Ask, Feedback Request or Feedback it concerns. None of what anybody wrote is stored here, so
-- the Request and Feedback messages stay in exactly one place and a name that changes is never
-- frozen into a sentence; the names are resolved when the bell is read (design 0022 D3).
-- Which kind of thing "subjectId" names follows from "type", each of which has exactly one kind
-- of subject, so there is deliberately no second column holding a value derivable from the first
-- (design 0022 D4).
-- The table is new, so no existing row is touched. "workspaceId", "recipientAccountId" and
-- "actorAccountId" are ids with no foreign key out of the module (BE_03 R7), as on
-- "integration_connection" and "linked_account".
-- The unique index is what makes writing a Notification idempotent: a double-submitted form or a
-- retried request inserts with ON CONFLICT DO NOTHING and still leaves one line in the bell. A
-- read-then-insert check would be a race two writers can both win; an index is not.
-- The second index serves the unread count, the one query here that runs on every poll of the
-- bell and so the only one worth an index up front. A partial index on "readAt" IS NULL would be
-- tighter, and is a raw migration to write only if a measurement ever asks for it.
-- Rollback: DROP TABLE "notification";

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recipientAccountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorAccountId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_recipientAccountId_workspaceId_readAt_idx" ON "notification"("recipientAccountId", "workspaceId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipientAccountId_type_subjectId_key" ON "notification"("recipientAccountId", "type", "subjectId");
