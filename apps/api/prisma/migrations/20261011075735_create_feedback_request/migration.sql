-- Feedback module: a Feedback Request and one Ask per Member asked (#21). New tables only;
-- no existing row changes. No foreign key into another module's tables (BE_03 R7), so the
-- Workspace and the Accounts are held as plain ids.
-- Rollback: DROP TABLE "feedback_ask"; DROP TABLE "feedback_request"; DROP TYPE "AskStatus"; DROP TYPE "Visibility";
-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('ONLY_ME', 'SELECTED_PEOPLE', 'EVERYONE');

-- CreateEnum
CREATE TYPE "AskStatus" AS ENUM ('PENDING', 'ANSWERED', 'EXPIRED');

-- CreateTable
CREATE TABLE "feedback_request" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "requesterAccountId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'ONLY_ME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_ask" (
    "id" TEXT NOT NULL,
    "feedbackRequestId" TEXT NOT NULL,
    "giverAccountId" TEXT NOT NULL,
    "status" "AskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_ask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_request_workspaceId_requesterAccountId_idx" ON "feedback_request"("workspaceId", "requesterAccountId");

-- CreateIndex
CREATE INDEX "feedback_ask_giverAccountId_status_idx" ON "feedback_ask"("giverAccountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_ask_feedbackRequestId_giverAccountId_key" ON "feedback_ask"("feedbackRequestId", "giverAccountId");

-- AddForeignKey
ALTER TABLE "feedback_ask" ADD CONSTRAINT "feedback_ask_feedbackRequestId_fkey" FOREIGN KEY ("feedbackRequestId") REFERENCES "feedback_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
