import type { TextTags } from './text-tags.type';

/** The fixed set of Reactions a Member can add to Feedback on the feed (`ADR-0022`). */
export const REACTIONS = [
  { emoji: '👏', name: 'Clap' },
  { emoji: '❤️', name: 'Heart' },
  { emoji: '💡', name: 'Idea' },
  { emoji: '🙏', name: 'Thanks' },
] as const;

export type ReactionEmoji = (typeof REACTIONS)[number]['emoji'];

/** One piece of Feedback as a feed card shows it. */
export type FeedItem = {
  readonly id: string;
  /** `null` while the Giver has not introduced themselves. */
  readonly giverName: string | null;
  /** The Giver's Google photo, or `null` when they have none. */
  readonly giverPhotoUrl: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly giverInactive: boolean;
  /** `null` while the Receiver has not introduced themselves. */
  readonly receiverName: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly receiverInactive: boolean;
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
};
