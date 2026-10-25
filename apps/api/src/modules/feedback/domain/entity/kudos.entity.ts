import { KudosNeedsARecipientError } from '../feedback-request.errors';
import type {
  BoundMention,
  BoundTags,
  BoundWorkspaceGoal,
} from '../value-object/bound-tags.vo';
import type { KudosMessage } from '../value-object/kudos-message.vo';

export interface KudosSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly giverAccountId: string;
  /** Every Member it is for, once each. Never the Giver. */
  readonly recipientAccountIds: readonly string[];
  readonly message: string;
  readonly workspaceGoals: readonly BoundWorkspaceGoal[];
  readonly mentions: readonly BoundMention[];
}

/**
 * Praise written once and given to every teammate it @mentions (brain `ADR-0043`). Every Member
 * of the Workspace reads it, so unlike Feedback it holds no Visibility, and unlike Feedback it
 * can be for many people at once. Its own aggregate root: nothing else changes with it.
 *
 * Who it is for is not sent beside the message — it is read out of it. The recipients are the
 * Members the message's slugs were bound to, which only ever binds active Members of the
 * Workspace, less the Giver, who may name themselves but cannot be given their own Kudos.
 */
export class Kudos {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly giverAccountId: string,
    private readonly recipientAccountIds: readonly string[],
    private readonly message: KudosMessage,
    private readonly tags: BoundTags,
  ) {}

  /** The Giver gives Kudos to everyone the message names, and refuses to give it to nobody. */
  static give(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly giverAccountId: string;
    readonly message: KudosMessage;
    /** What the message names; its mentions are who the Kudos is for. */
    readonly tags: BoundTags;
  }): Kudos {
    const recipients = details.tags
      .mentions()
      .map((mention) => mention.accountId)
      .filter((accountId) => accountId !== details.giverAccountId);
    if (recipients.length === 0) {
      throw new KudosNeedsARecipientError();
    }
    return new Kudos(
      details.id,
      details.workspaceId,
      details.giverAccountId,
      recipients,
      details.message,
      details.tags,
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
    };
  }
}
