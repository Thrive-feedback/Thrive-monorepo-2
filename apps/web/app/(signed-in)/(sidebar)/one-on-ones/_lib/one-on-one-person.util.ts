import type { OneOnOne } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

/** The other person in a 1:1, as the page names and pictures them. */
export type OneOnOnePerson = {
  readonly accountId: string;
  readonly name: string;
  /** What fits in a sentence: their @handle's name, or the first word of their name. */
  readonly shortName: string;
  readonly photoUrl: string | null;
};

/** Whoever is in it beside the reader. */
export function otherAccountOf(oneOnOne: OneOnOne): string {
  return oneOnOne.withAccountId;
}

/**
 * The other person in a 1:1, found among the reader's teammates. Somebody who has left the
 * Workspace is no longer among them, and is named as a former teammate rather than by an id.
 */
export function otherPersonOf(
  oneOnOne: OneOnOne,
  teammates: readonly Teammate[],
): OneOnOnePerson {
  const accountId = otherAccountOf(oneOnOne);
  const teammate = teammates.find((each) => each.accountId === accountId);
  if (!teammate) {
    return {
      accountId,
      name: 'A former teammate',
      shortName: 'they',
      photoUrl: null,
    };
  }
  return {
    accountId,
    name: teammate.name,
    shortName: teammate.name.split(/\s+/)[0] ?? teammate.name,
    photoUrl: teammate.photoUrl,
  };
}
