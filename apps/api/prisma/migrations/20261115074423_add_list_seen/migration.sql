-- CreateEnum
CREATE TYPE "SeenList" AS ENUM ('RECEIVED_REQUESTS', 'RECEIVED_OFFERED', 'RECEIVED_KUDOS', 'SHARED_WITH_ME');

-- CreateTable
CREATE TABLE "list_seen" (
    "workspaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "list" "SeenList" NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "list_seen_pkey" PRIMARY KEY ("workspaceId","accountId","list")
);
