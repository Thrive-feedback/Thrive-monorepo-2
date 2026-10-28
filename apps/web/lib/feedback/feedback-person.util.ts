import type { components } from '@repo/api';

/** Somebody a piece of Feedback names — its Giver or one of its Receivers — as a card shows them. */
export type FeedbackPerson = {
  /** `null` while they have not introduced themselves. */
  readonly name: string | null;
  /** Their Google photo, or `null` when they have none. */
  readonly photoUrl: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what was written stays. */
  readonly inactive: boolean;
  /** The signed-in person themself, whom every card names "you". */
  readonly isYou: boolean;
};

/** A person as the API sends them, on every route that names one. */
type PersonOnTheWire =
  components['schemas']['GetFeedbackResponseDto_Output']['giver'];

/**
 * One person off the wire, as a card shows them. `viewerAccountId` is whoever is reading, so the
 * card can name them "you"; `null` reads nobody as "you".
 */
export function toFeedbackPerson(
  person: PersonOnTheWire,
  viewerAccountId: string | null,
): FeedbackPerson {
  return {
    name: person.name,
    photoUrl: person.photoUrl,
    inactive: person.status === 'DEACTIVATED',
    isYou: person.accountId === viewerAccountId,
  };
}
