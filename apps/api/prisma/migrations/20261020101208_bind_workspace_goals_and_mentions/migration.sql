-- Feedback module: the Workspace Goals and Mentions a request's Topic and a piece of Feedback
-- were bound to when sent (#227, #228, brain ADR-0036). Four new tables only; no existing row
-- changes, and Feedback sent before this binds nothing. Workspace Goals and Accounts belong to
-- other modules, so they are plain ids with no foreign key (BE_03 R7); each row cascades with
-- the request or Feedback it belongs to.
-- Rollback: DROP TABLE "feedback_mention", "feedback_workspace_goal", "feedback_request_mention",
-- "feedback_request_workspace_goal";
-- CreateTable
CREATE TABLE "feedback_request_workspace_goal" (
    "feedbackRequestId" TEXT NOT NULL,
    "workspaceGoalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "feedback_request_workspace_goal_pkey" PRIMARY KEY ("feedbackRequestId","workspaceGoalId")
);

-- CreateTable
CREATE TABLE "feedback_request_mention" (
    "feedbackRequestId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "feedback_request_mention_pkey" PRIMARY KEY ("feedbackRequestId","accountId")
);

-- CreateTable
CREATE TABLE "feedback_workspace_goal" (
    "feedbackId" TEXT NOT NULL,
    "workspaceGoalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "feedback_workspace_goal_pkey" PRIMARY KEY ("feedbackId","workspaceGoalId")
);

-- CreateTable
CREATE TABLE "feedback_mention" (
    "feedbackId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "feedback_mention_pkey" PRIMARY KEY ("feedbackId","accountId")
);

-- AddForeignKey
ALTER TABLE "feedback_request_workspace_goal" ADD CONSTRAINT "feedback_request_workspace_goal_feedbackRequestId_fkey" FOREIGN KEY ("feedbackRequestId") REFERENCES "feedback_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_request_mention" ADD CONSTRAINT "feedback_request_mention_feedbackRequestId_fkey" FOREIGN KEY ("feedbackRequestId") REFERENCES "feedback_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_workspace_goal" ADD CONSTRAINT "feedback_workspace_goal_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_mention" ADD CONSTRAINT "feedback_mention_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
