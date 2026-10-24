-- Notifications module, its first table: one Member's own link to their account in a chat tool,
-- which is what lets Thrive message them directly (#211, design 0021). Nothing stored here is a
-- credential — the user access token the provider issues at linking is used once to learn who
-- they are and is never written down (design 0021 D9), and Thrive messages with its own
-- application-wide bot credential.
-- The table is new, so no existing row is touched. "accountId" is an id with no foreign key out
-- of the module (BE_03 R7), as on "integration_connection".
-- Two unique indexes, and the second is the reason "externalTeamId" is NOT NULL and holds '' for
-- a provider without the concept: Postgres treats NULLs as distinct, so a nullable column would
-- let ('DISCORD', NULL, 'U1') be inserted twice and the constraint would silently not hold —
-- which is two Members quietly sharing one notification stream (design 0021 D8).
-- Rollback: DROP TABLE "linked_account";

-- CreateTable
CREATE TABLE "linked_account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalTeamId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "externalUsername" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linked_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linked_account_accountId_provider_key" ON "linked_account"("accountId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "linked_account_provider_externalTeamId_externalUserId_key" ON "linked_account"("provider", "externalTeamId", "externalUserId");
