-- CreateEnum
CREATE TYPE "OneOnOneTopicBroughtFromKind" AS ENUM ('FEEDBACK', 'KUDOS');

-- AlterTable
ALTER TABLE "one_on_one_topic" ADD COLUMN     "broughtFromId" TEXT,
ADD COLUMN     "broughtFromKind" "OneOnOneTopicBroughtFromKind";
