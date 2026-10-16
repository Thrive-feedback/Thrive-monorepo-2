-- Feedback module: the access path for "Shared with me" (#88). That read starts at the reader —
-- every piece of Feedback one Account was selected for — and the primary key's
-- (feedbackId, accountId) order has no usable prefix for it, so without this index the read scans
-- the whole join table. Existing rows are untouched: nothing is added, rewritten or backfilled.
-- Rollback: DROP INDEX "feedback_selected_person_accountId_idx"; the read degrades to a scan.

-- CreateIndex
CREATE INDEX "feedback_selected_person_accountId_idx" ON "feedback_selected_person"("accountId");
