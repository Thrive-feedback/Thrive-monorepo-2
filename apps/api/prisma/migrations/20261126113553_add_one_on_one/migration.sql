-- CreateEnum
CREATE TYPE "OneOnOneStatus" AS ENUM ('INVITED', 'ACTIVE', 'DECLINED', 'ENDED');

-- CreateEnum
CREATE TYPE "OneOnOneCadence" AS ENUM ('WEEKLY', 'EVERY_TWO_WEEKS', 'MONTHLY', 'ONCE');

-- CreateEnum
CREATE TYPE "OneOnOneTopicSource" AS ENUM ('CARRIED', 'TEMPLATE', 'PERSON');

-- CreateTable
CREATE TABLE "one_on_one" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "startedByAccountId" TEXT NOT NULL,
    "invitedAccountId" TEXT NOT NULL,
    "status" "OneOnOneStatus" NOT NULL,
    "cadence" "OneOnOneCadence" NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "lengthMinutes" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "templateKey" TEXT NOT NULL,
    "inviteNote" TEXT,
    "suggestedAt" TIMESTAMP(3),
    "answerNote" TEXT,
    "answeredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "one_on_one_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_on_one_meeting" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "oneOnOneId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "occursAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "startedByAccountId" TEXT,
    "finishedAt" TIMESTAMP(3),
    "finishedByAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "one_on_one_meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_on_one_topic" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" "OneOnOneTopicSource" NOT NULL,
    "authorAccountId" TEXT,
    "position" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "notesUpdatedAt" TIMESTAMP(3),
    "notesUpdatedByAccountId" TEXT,
    "discussedAt" TIMESTAMP(3),

    CONSTRAINT "one_on_one_topic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "one_on_one_workspaceId_startedByAccountId_idx" ON "one_on_one"("workspaceId", "startedByAccountId");

-- CreateIndex
CREATE INDEX "one_on_one_workspaceId_invitedAccountId_idx" ON "one_on_one"("workspaceId", "invitedAccountId");

-- CreateIndex
CREATE INDEX "one_on_one_meeting_oneOnOneId_finishedAt_idx" ON "one_on_one_meeting"("oneOnOneId", "finishedAt");

-- CreateIndex
CREATE INDEX "one_on_one_topic_meetingId_position_idx" ON "one_on_one_topic"("meetingId", "position");

-- AddForeignKey
ALTER TABLE "one_on_one_meeting" ADD CONSTRAINT "one_on_one_meeting_oneOnOneId_fkey" FOREIGN KEY ("oneOnOneId") REFERENCES "one_on_one"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_on_one_topic" ADD CONSTRAINT "one_on_one_topic_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "one_on_one_meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
