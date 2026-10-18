-- Integrations module, its first table: one Workspace's authorised link to one external chat
-- tool and the one channel it posts in (#199, design 0020). Nothing stored here is a credential —
-- for Discord a server id is known to everyone in it and a channel id grants nothing on its own;
-- Thrive's own bot credential is one application-wide configuration value. A provider that issues
-- a per-Workspace token (Slack does) adds that column with its cipher and key handling together,
-- when they have a reader.
-- The table is new, so no existing row is touched. "workspaceId" and "connectedByAccountId" are
-- ids with no foreign key out of the module (BE_03 R7), as on "feedback_request".
-- The unique index carries the provider so that a second tool is not a migration; one Connection
-- per Workspace is the application's check (design 0020 D7).
-- Rollback: DROP TABLE "integration_connection";

-- CreateTable
CREATE TABLE "integration_connection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalWorkspaceId" TEXT NOT NULL,
    "externalWorkspaceName" TEXT NOT NULL,
    "externalChannelId" TEXT NOT NULL,
    "externalChannelName" TEXT NOT NULL,
    "connectedByAccountId" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_connection_workspaceId_provider_key" ON "integration_connection"("workspaceId", "provider");
