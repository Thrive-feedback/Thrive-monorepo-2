import type { TextTags } from './text-tags.type';

/** Somebody a Kudos names, as a card shows them. */
export type KudosPerson = {
  /** `null` while they have not introduced themselves. */
  readonly name: string | null;
  /** Deactivated in this Workspace, so shown as inactive; the Kudos stays. */
  readonly inactive: boolean;
  /** The signed-in person themself, whom the card names "you". */
  readonly isYou: boolean;
};

/** One Kudos as a feed card shows it. Every Member of the Workspace reads it. */
export type KudosItem = {
  readonly id: string;
  readonly giver: KudosPerson;
  /** Everyone it is for, at least one. */
  readonly recipients: readonly KudosPerson[];
  /** What the Giver wrote. */
  readonly message: string;
  /** What the message was bound to. */
  readonly messageTags: TextTags;
  readonly givenAt: string;
};

/** As long as the API lets a Kudos be, counted in the characters a reader sees. */
export const MAX_KUDOS_LENGTH = 280;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** How long a Kudos is, as the API counts it: trimmed, an emoji or a Thai cluster as one. */
export function kudosLength(message: string): number {
  return [...graphemes.segment(message.trim())].length;
}
