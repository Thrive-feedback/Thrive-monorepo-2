-- CreateTable
CREATE TABLE "feedback_summary" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "promptVersion" INTEGER NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "sourceWatermark" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_summary_accountId_workspaceId_period_key" ON "feedback_summary"("accountId", "workspaceId", "period");
