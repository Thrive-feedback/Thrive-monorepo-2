-- CreateTable
CREATE TABLE "outbox_message" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "deadAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_message_idempotencyKey_key" ON "outbox_message"("idempotencyKey");

-- The index the relay claims through, written by hand because Prisma cannot declare a partial
-- one. The predicate keeps it the size of the backlog rather than the size of history, which is
-- what makes keeping delivered rows for a week affordable (ADR 0076).
CREATE INDEX "outbox_message_due_idx"
    ON "outbox_message" ("availableAt", "id")
    WHERE "deliveredAt" IS NULL AND "deadAt" IS NULL;
