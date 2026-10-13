-- When an Invitation's email last went out, for the resend cooldown. Nullable: existing rows
-- were last sent when they were created. Rollback: ALTER TABLE "invitation" DROP COLUMN "lastSentAt";
-- AlterTable
ALTER TABLE "invitation" ADD COLUMN     "lastSentAt" TIMESTAMP(3);
