-- AlterTable
ALTER TABLE "one_on_one_topic" ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "templateKey" TEXT;

-- AddForeignKey
ALTER TABLE "one_on_one_topic" ADD CONSTRAINT "one_on_one_topic_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "one_on_one_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
