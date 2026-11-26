-- CreateEnum
CREATE TYPE "OneOnOneTemplateScope" AS ENUM ('WORKSPACE', 'PERSONAL');

-- AlterTable
ALTER TABLE "one_on_one" ADD COLUMN     "templateId" TEXT,
ALTER COLUMN "templateKey" DROP NOT NULL;

-- AlterTable
ALTER TABLE "one_on_one_meeting" ADD COLUMN     "templateId" TEXT,
ALTER COLUMN "templateKey" DROP NOT NULL;

-- CreateTable
CREATE TABLE "one_on_one_template" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "scope" "OneOnOneTemplateScope" NOT NULL,
    "ownerAccountId" TEXT,
    "name" TEXT NOT NULL,
    "suggestedWhen" TEXT NOT NULL DEFAULT '',
    "questions" TEXT[],
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "one_on_one_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "one_on_one_template_workspaceId_scope_ownerAccountId_idx" ON "one_on_one_template"("workspaceId", "scope", "ownerAccountId");

-- AddForeignKey
ALTER TABLE "one_on_one" ADD CONSTRAINT "one_on_one_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "one_on_one_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_on_one_meeting" ADD CONSTRAINT "one_on_one_meeting_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "one_on_one_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
