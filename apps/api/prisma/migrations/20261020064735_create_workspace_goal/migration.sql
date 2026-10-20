-- Workspace Goal module: the hashtags an Admin creates for a Workspace (#225, brain ADR-0036).
-- A new table and enum only; no existing row changes. The Workspace is a plain id with no
-- foreign key (BE_03 R7). The unique index on ("workspaceId", "nameKey") is the rule "no two
-- Workspace Goals differ only in letter case, hidden ones included" — it is what refuses the
-- second of two Admins adding the same name at once, which no check in the application can do.
-- Rollback: DROP TABLE "workspace_goal"; DROP TYPE "WorkspaceGoalStatus";
-- CreateEnum
CREATE TYPE "WorkspaceGoalStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateTable
CREATE TABLE "workspace_goal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkspaceGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_goal_workspaceId_nameKey_key" ON "workspace_goal"("workspaceId", "nameKey");
