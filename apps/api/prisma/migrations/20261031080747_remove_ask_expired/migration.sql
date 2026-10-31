/*
  Warnings:

  - The values [EXPIRED] on the enum `AskStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AskStatus_new" AS ENUM ('PENDING', 'ANSWERED');
ALTER TABLE "public"."feedback_ask" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "feedback_ask" ALTER COLUMN "status" TYPE "AskStatus_new" USING ("status"::text::"AskStatus_new");
ALTER TYPE "AskStatus" RENAME TO "AskStatus_old";
ALTER TYPE "AskStatus_new" RENAME TO "AskStatus";
DROP TYPE "public"."AskStatus_old";
ALTER TABLE "feedback_ask" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
