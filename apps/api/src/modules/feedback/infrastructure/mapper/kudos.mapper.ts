import type {
  KudosMention as KudosMentionRecord,
  KudosRecipient as KudosRecipientRecord,
  Kudos as KudosRecord,
  KudosWorkspaceGoal as KudosWorkspaceGoalRecord,
} from '@app/infrastructure/database/generated/client';
import { Prisma } from '@app/infrastructure/database/generated/client';
import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type { Kudos } from '../../domain/entity/kudos.entity';
import {
  KUDOS_INKS,
  type KudosCardSnapshot,
} from '../../domain/value-object/kudos-card.vo';
import {
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
} from '../../domain/value-object/postcard.vo';

/** The only place that knows both the stored rows and the Kudos entity. */

const logger = new Logger('KudosMapper');

/**
 * The stored shape, read back without the value's limits: a card was valid when it was sent, and a
 * limit changed later must not stop its Kudos being read (ADR 0073).
 */
const storedKudosCardSchema = z.object({
  templateKey: z.string(),
  textStyle: z.object({
    font: z.enum(POSTCARD_FONTS),
    sizeStep: z.number(),
    align: z.enum(POSTCARD_ALIGNS),
    ink: z.enum(KUDOS_INKS),
  }),
  stickers: z.array(
    z.object({
      stickerKey: z.string(),
      x: z.number(),
      y: z.number(),
      scale: z.number(),
      rotation: z.number(),
    }),
  ),
});

/**
 * A stored card, or `null` when there is none. One that no longer reads, such as an ink since
 * retired, also reads as none: its Kudos is plain, rather than a page of the list failing.
 */
export function toKudosCardSnapshot(stored: unknown): KudosCardSnapshot | null {
  if (stored === null) {
    return null;
  }
  const card = storedKudosCardSchema.safeParse(stored);
  if (!card.success) {
    logger.warn({
      event: 'feedback.kudos_card_unreadable',
      fields: card.error.issues.map((issue) => issue.path.join('.')),
    });
    return null;
  }
  return card.data;
}

/** The audit timestamps are the database's to set. */
export function toKudosRecord(kudos: Kudos): Omit<
  KudosRecord,
  'createdAt' | 'updatedAt' | 'card'
> & {
  /** Prisma tells a stored `null` from an absent one, so a card that is not there is `DbNull`. */
  readonly card: KudosCardSnapshot | typeof Prisma.DbNull;
} {
  const snapshot = kudos.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    giverAccountId: snapshot.giverAccountId,
    message: snapshot.message,
    card: snapshot.card ?? Prisma.DbNull,
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
