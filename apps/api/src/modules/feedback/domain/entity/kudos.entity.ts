import type {
  BoundMention,
  BoundTags,
  BoundWorkspaceGoal,
} from '../value-object/bound-tags.vo';
import type {
  KudosCard,
  KudosCardSnapshot,
} from '../value-object/kudos-card.vo';
import type { KudosMessage } from '../value-object/kudos-message.vo';

export interface KudosSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly giverAccountId: string;
  /** Every Member it names, once each, never the Giver. None: it is for the whole Workspace. */
  readonly recipientAccountIds: readonly string[];
  readonly message: string;
  readonly workspaceGoals: readonly BoundWorkspaceGoal[];
  readonly mentions: readonly BoundMention[];
  /** How it looks, or `null` when it was not written on a card. */
  readonly card: KudosCardSnapshot | null;
}

/**
 * Praise written once and given to every teammate it @mentions (brain `ADR-0043`). Every Member
 * of the Workspace reads it, so unlike Feedback it holds no Visibility, and unlike Feedback it
 * can be for many people at once. Its own aggregate root: nothing else changes with it.
 *
 * Who it is for is not sent beside the message — it is read out of it. The recipients are the
 * Members the message's slugs were bound to, which only ever binds active Members of the
 * Workspace, less the Giver, who may name themselves but cannot be given their own Kudos. A Kudos
 * that names nobody is for the whole Workspace (ADR 0074).
 */
export class Kudos {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly giverAccountId: string,
    private readonly recipientAccountIds: readonly string[],
    private readonly message: KudosMessage,
    private readonly tags: BoundTags,
    private readonly card: KudosCard | null,
  ) {}

  /** The Giver gives Kudos to everyone the message names, or to the whole Workspace. */
  static give(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly giverAccountId: string;
    readonly message: KudosMessage;
    /** What the message names; its mentions are who the Kudos is for. */
    readonly tags: BoundTags;
    readonly card: KudosCard | null;
  }): Kudos {
    const recipients = details.tags
      .mentions()
      .map((mention) => mention.accountId)
      .filter((accountId) => accountId !== details.giverAccountId);
    return new Kudos(
      details.id,
      details.workspaceId,
      details.giverAccountId,
      recipients,
      details.message,
      details.tags,
      details.card,
    );
  }

  snapshot(): KudosSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      giverAccountId: this.giverAccountId,
      recipientAccountIds: this.recipientAccountIds,
      message: this.message.toString(),
      workspaceGoals: this.tags.workspaceGoals(),
      mentions: this.tags.mentions(),
      card: this.card?.snapshot() ?? null,
    };
  }
}
