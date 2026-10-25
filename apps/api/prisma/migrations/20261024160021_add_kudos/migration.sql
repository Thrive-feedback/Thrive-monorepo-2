-- CreateTable
CREATE TABLE "kudos" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "giverAccountId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kudos_recipient" (
    "kudosId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "kudos_recipient_pkey" PRIMARY KEY ("kudosId","accountId")
);

-- CreateTable
CREATE TABLE "kudos_workspace_goal" (
    "kudosId" TEXT NOT NULL,
    "workspaceGoalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "kudos_workspace_goal_pkey" PRIMARY KEY ("kudosId","workspaceGoalId")
);

-- CreateTable
CREATE TABLE "kudos_mention" (
    "kudosId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "kudos_mention_pkey" PRIMARY KEY ("kudosId","accountId")
);

-- CreateIndex
CREATE INDEX "kudos_workspaceId_createdAt_id_idx" ON "kudos"("workspaceId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "kudos_recipient_accountId_idx" ON "kudos_recipient"("accountId");

-- AddForeignKey
ALTER TABLE "kudos_recipient" ADD CONSTRAINT "kudos_recipient_kudosId_fkey" FOREIGN KEY ("kudosId") REFERENCES "kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos_workspace_goal" ADD CONSTRAINT "kudos_workspace_goal_kudosId_fkey" FOREIGN KEY ("kudosId") REFERENCES "kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos_mention" ADD CONSTRAINT "kudos_mention_kudosId_fkey" FOREIGN KEY ("kudosId") REFERENCES "kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
