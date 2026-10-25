import type {
  KudosMention as KudosMentionRecord,
  KudosRecipient as KudosRecipientRecord,
  Kudos as KudosRecord,
  KudosWorkspaceGoal as KudosWorkspaceGoalRecord,
} from '@app/infrastructure/database/generated/client';
import type { Kudos } from '../../domain/entity/kudos.entity';

/** The only place that knows both the stored rows and the Kudos entity. */

/** The audit timestamps are the database's to set. */
export function toKudosRecord(
  kudos: Kudos,
): Omit<KudosRecord, 'createdAt' | 'updatedAt'> {
  const snapshot = kudos.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    giverAccountId: snapshot.giverAccountId,
    message: snapshot.message,
  };
}

/** One row per Member it is for. */
export function toKudosRecipientRecords(
  kudos: Kudos,
): Omit<KudosRecipientRecord, 'kudosId'>[] {
  return kudos
    .snapshot()
    .recipientAccountIds.map((accountId) => ({ accountId }));
}

/** One row per Workspace Goal its Giver named. */
export function toKudosWorkspaceGoalRecords(
  kudos: Kudos,
): Omit<KudosWorkspaceGoalRecord, 'kudosId'>[] {
  return kudos.snapshot().workspaceGoals.map((workspaceGoal) => ({
    workspaceGoalId: workspaceGoal.workspaceGoalId,
    name: workspaceGoal.name,
  }));
}

/** One row per Member its Giver mentioned. */
export function toKudosMentionRecords(
  kudos: Kudos,
): Omit<KudosMentionRecord, 'kudosId'>[] {
  return kudos.snapshot().mentions.map((mention) => ({
    accountId: mention.accountId,
    slug: mention.slug,
    displayName: mention.displayName,
  }));
}
