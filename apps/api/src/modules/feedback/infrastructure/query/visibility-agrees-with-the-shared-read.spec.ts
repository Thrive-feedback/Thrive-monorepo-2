import { describe, expect, it } from 'bun:test';
import {
  VISIBILITIES,
  Visibility,
  type VisibilityValue,
} from '../../domain/value-object/visibility.vo';

const GIVER = 'account-giver';
const RECEIVER = 'account-receiver';
const READER = 'account-reader';
const SOMEBODY_ELSE = 'account-somebody-else';

interface StoredRow {
  readonly visibility: VisibilityValue;
  readonly selectedAccountIds: readonly string[];
}

/**
 * What `sharedWith` asks the database, in TypeScript: the `visibility` column is Selected people
 * and a `feedback_selected_person` row names the reader. Kept beside the query it mirrors, so a
 * change to one is read next to the other.
 */
function theSharedReadReturns(
  row: StoredRow,
  readerAccountId: string,
): boolean {
  return (
    row.visibility === 'SELECTED_PEOPLE' &&
    row.selectedAccountIds.includes(readerAccountId)
  );
}

function theVisibilityLetsRead(
  row: StoredRow,
  readerAccountId: string,
): boolean {
  return Visibility.of({
    value: row.visibility,
    selectedAccountIds: row.selectedAccountIds,
  }).letsRead({
    readerAccountId,
    giverAccountId: GIVER,
    receiverAccountId: RECEIVER,
  });
}

/** Every Visibility a stored row can carry, with and without the reader selected. */
const ROWS: readonly StoredRow[] = VISIBILITIES.flatMap((visibility) =>
  (visibility === 'SELECTED_PEOPLE'
    ? [[READER], [READER, SOMEBODY_ELSE], [SOMEBODY_ELSE]]
    : [[]]
  ).map((selectedAccountIds) => ({ visibility, selectedAccountIds })),
);

function named(row: StoredRow): string {
  const selected =
    row.selectedAccountIds.length === 0
      ? 'nobody'
      : row.selectedAccountIds.join(' and ');
  return `${row.visibility} with ${selected} selected`;
}

/**
 * ADR 0044 states one rule in two places: `Visibility.letsRead` decides one piece, and a list
 * read decides a page of them in its `WHERE`. This holds the two readings together for a reader
 * who is neither the Giver nor the Receiver — the only reader *Shared with me* is about.
 *
 * `sharedWith` is deliberately **narrower** than the value object: it returns Selected people
 * only, because Everyone belongs to the Workspace feed (#90), which reads the same rule from the
 * other side. So the invariant is a subset, plus exact agreement wherever somebody was selected.
 *
 * The Giver and the Receiver sit outside it: both always read a piece, and neither can be
 * selected to (`Feedback.offer` refuses it), so no row this list returns can name them as its
 * reader. They read their own Feedback on their own screens.
 */
describe('the Visibility and the Shared with me read', () => {
  for (const row of ROWS) {
    it(`never shares ${named(row)} with somebody the Visibility shuts out`, () => {
      for (const reader of [READER, SOMEBODY_ELSE]) {
        if (theSharedReadReturns(row, reader)) {
          expect(theVisibilityLetsRead(row, reader)).toBe(true);
        }
      }
    });
  }

  for (const row of ROWS.filter(
    (candidate) => candidate.visibility === 'SELECTED_PEOPLE',
  )) {
    it(`answers exactly as the Visibility does for ${named(row)}`, () => {
      for (const reader of [READER, SOMEBODY_ELSE]) {
        expect(theSharedReadReturns(row, reader)).toBe(
          theVisibilityLetsRead(row, reader),
        );
      }
    });
  }

  it('leaves Everyone to the Workspace feed, although the Visibility allows it', () => {
    const everyone: StoredRow = {
      visibility: 'EVERYONE',
      selectedAccountIds: [],
    };

    expect(theVisibilityLetsRead(everyone, READER)).toBe(true);
    expect(theSharedReadReturns(everyone, READER)).toBe(false);
  });
});
