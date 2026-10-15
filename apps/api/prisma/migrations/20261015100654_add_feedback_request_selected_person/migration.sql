-- Feedback module: the Members a Requester selected to read what a request collects (#84). A
-- new table only; existing requests are all ONLY_ME and keep no selected people, so no row
-- changes. The one foreign key stays inside this module (BE_03 R7): the Account is a plain id.
-- Rollback: DROP TABLE "feedback_request_selected_person";
-- CreateTable
CREATE TABLE "feedback_request_selected_person" (
    "feedbackRequestId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "feedback_request_selected_person_pkey" PRIMARY KEY ("feedbackRequestId","accountId")
);

-- AddForeignKey
ALTER TABLE "feedback_request_selected_person" ADD CONSTRAINT "feedback_request_selected_person_feedbackRequestId_fkey" FOREIGN KEY ("feedbackRequestId") REFERENCES "feedback_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
