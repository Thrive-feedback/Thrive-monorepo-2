-- Workspace module: a Workspace and its Members (#72). New tables only; no existing row changes.
-- Rollback: DROP TABLE "member"; DROP TABLE "workspace"; DROP TYPE "MemberRole"; DROP TYPE "TeamSize";
-- CreateEnum
CREATE TYPE "TeamSize" AS ENUM ('JUST_ME', 'FROM_2_TO_10', 'FROM_11_TO_50', 'OVER_50');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER');

-- CreateTable
CREATE TABLE "workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamSize" "TeamSize",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_workspaceId_userId_key" ON "member"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

