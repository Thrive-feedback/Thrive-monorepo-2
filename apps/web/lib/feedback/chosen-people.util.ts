import type { Teammate } from './teammate.type';

/**
 * The teammates the Account ids name, in the order the ids are given, as an avatar stack takes
 * them. An id that names nobody, such as someone who has since left, is skipped.
 */
export function chosenPeople(
  teammates: readonly Teammate[],
  accountIds: Iterable<string>,
): { id: string; name: string; photoUrl: string | null }[] {
  return [...accountIds].flatMap((accountId) => {
    const teammate = teammates.find((one) => one.accountId === accountId);
    return teammate
      ? [
          {
            id: teammate.accountId,
            name: teammate.name,
            photoUrl: teammate.photoUrl,
          },
        ]
      : [];
  });
}
