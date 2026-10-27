/** Somebody a piece of Feedback names — its Giver or one of its Receivers — as a card shows them. */
export type FeedbackPerson = {
  /** `null` while they have not introduced themselves. */
  readonly name: string | null;
  /** Their Google photo, or `null` when they have none. */
  readonly photoUrl: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what was written stays. */
  readonly inactive: boolean;
};

/** A person as the API sends them, on every route that names one. */
type PersonOnTheWire = {
  readonly name: string | null;
  readonly photoUrl: string | null;
  readonly status: 'ACTIVE' | 'DEACTIVATED';
};

/** One person off the wire, as a card shows them. */
export function toFeedbackPerson(person: PersonOnTheWire): FeedbackPerson {
  return {
    name: person.name,
    photoUrl: person.photoUrl,
    inactive: person.status === 'DEACTIVATED',
  };
}
