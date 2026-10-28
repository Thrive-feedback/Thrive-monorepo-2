import type { FeedbackPerson } from './feedback-person.util';
import type { TextTags } from './text-tags.type';

/** The fixed set of Reactions a Member can add to Feedback on the feed (`ADR-0022`). */
export const REACTIONS = [
  { emoji: '👏', name: 'Clap' },
  { emoji: '❤️', name: 'Heart' },
  { emoji: '💡', name: 'Idea' },
  { emoji: '🙏', name: 'Thanks' },
] as const;

export type ReactionEmoji = (typeof REACTIONS)[number]['emoji'];

/** The request a piece of Requested Feedback answers, as the Workspace feed shows it. */
export type AnsweredRequest = {
  /** The Request message, as the Requester wrote it. */
  readonly message: string;
  /** What the Request message was bound to. */
  readonly messageTags: TextTags;
  readonly requester: FeedbackPerson;
  /** Everyone the request asked, in the order they were asked — never who did or did not answer. */
  readonly asked: readonly FeedbackPerson[];
};

/** One piece of Feedback as a feed card shows it. */
export type FeedItem = {
  readonly id: string;
  /** `null` while the Giver has not introduced themselves. */
  readonly giverName: string | null;
  /** The Giver's Google photo, or `null` when they have none. */
  readonly giverPhotoUrl: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly giverInactive: boolean;
  /** Everyone it is for, in the order the Giver chose them — one or more (brain `ADR-0044`). */
  readonly receivers: readonly FeedbackPerson[];
  /** Requested answers an Ask; Offered was given without being asked. */
  readonly origin: 'REQUESTED' | 'OFFERED';
  /** The Feedback message, as its Giver wrote it. */
  readonly message: string;
  /** What the Feedback message was bound to. */
  readonly messageTags: TextTags;
  readonly givenAt: string;
  /** Who reacted, by Reaction. Names are shown: a Reaction is never anonymous. */
  readonly reactions: Readonly<
    Partial<Record<ReactionEmoji, readonly string[]>>
  >;
  /**
   * The request an answer responds to. Only the Workspace feed reads it (brain `ADR-0046`); every
   * other list, and all Offered Feedback, has `null`.
   */
  readonly request: AnsweredRequest | null;
};
