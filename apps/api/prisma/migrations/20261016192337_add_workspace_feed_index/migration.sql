-- Feedback module: the access path for the Workspace feed (#90). That read filters a Workspace's
-- Feedback by Visibility and orders by when it was written, with no person to narrow it by, and
-- the two indexes already on the table both lead with a person. It is also the one Feedback read
-- whose rows grow with the whole Workspace's activity rather than one Member's.
-- Existing rows are untouched: nothing is added, rewritten or backfilled.
-- Rollback: DROP INDEX "feedback_workspaceId_visibility_createdAt_idx"; the read degrades to a
-- scan and a sort.

-- CreateIndex
CREATE INDEX "feedback_workspaceId_visibility_createdAt_idx" ON "feedback"("workspaceId", "visibility", "createdAt");
