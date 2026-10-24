-- Caches the one-to-one conversation Thrive opened with one person in a chat tool, so every
-- message after the first costs one call instead of two (#213, design 0021 D4). Both Discord and
-- Slack return a stable id for such a conversation and both limit how often it may be opened, and
-- there is no Redis to put it in (BE_19 is todo), so it rides on the row it belongs to.
-- Nullable on purpose and filled lazily: null means "no message has arrived yet". It is not a
-- credential — the id grants nothing on its own, exactly as a channel id does not.
-- Adding a nullable column takes no table rewrite and no lock worth naming, and every existing
-- row keeps working: the first message to that person simply opens the conversation once more.
-- Rollback: ALTER TABLE "linked_account" DROP COLUMN "directChannelId";

-- AlterTable
ALTER TABLE "linked_account" ADD COLUMN "directChannelId" TEXT;
