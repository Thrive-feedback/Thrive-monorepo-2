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
 * and a `feedback_selected_person` row names the reader.
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

/**
 * What `publicIn` asks: the `visibility` column is Everyone. No reader appears in it, which is
 * why the Workspace guard is what keeps the feed inside the Workspace.
 */
function theFeedReadReturns(row: StoredRow): boolean {
  return row.visibility === 'EVERYONE';
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
    receiverAccountIds: [RECEIVER],
  });
}

/** Every Visibility a stored row can carry, with and without the reader selected. */
const ROWS: readonly StoredRow[] = VISIBILITIES.flatMap((visibility) =>
  (visibility === 'SELECTED_PEOPLE'
    ? [[READER], [READER, SOMEBODY_ELSE], [SOMEBODY_ELSE]]
    : [[]]
  ).map((selectedAccountIds) => ({ visibility, selectedAccountIds })),
);

const READERS = [READER, SOMEBODY_ELSE] as const;

function named(row: StoredRow): string {
  const selected =
    row.selectedAccountIds.length === 0
      ? 'nobody'
      : row.selectedAccountIds.join(' and ');
  return `${row.visibility} with ${selected} selected`;
}

/**
 * ADR 0044 states one rule in two places: `Visibility.letsRead` decides one piece, and the list
 * reads decide a page of them in their `WHERE`. These hold the readings together for a reader
 * who is neither the Giver nor the Receiver — the only reader these two screens are about.
 *
 * The Giver and the Receiver sit outside it: both always read a piece, and neither can be
 * selected to (`Feedback.offer` refuses it). They read their own Feedback on their own screens,
 * so a row either list returns can still be one of theirs — that is the feed, not a leak.
 */
describe('the Visibility and the list reads', () => {
  for (const row of ROWS) {
    it(`never lists ${named(row)} to somebody the Visibility shuts out`, () => {
      for (const reader of READERS) {
        if (theSharedReadReturns(row, reader) || theFeedReadReturns(row)) {
          expect(theVisibilityLetsRead(row, reader)).toBe(true);
        }
      }
    });

    it(`lists ${named(row)} on exactly one of the two screens, or neither`, () => {
      for (const reader of READERS) {
        expect(
          [theSharedReadReturns(row, reader), theFeedReadReturns(row)].filter(
            Boolean,
          ).length,
        ).toBeLessThanOrEqual(1);
      }
    });

    it(`shows ${named(row)} on a screen whenever the Visibility allows it`, () => {
      for (const reader of READERS) {
        expect(
          theSharedReadReturns(row, reader) || theFeedReadReturns(row),
        ).toBe(theVisibilityLetsRead(row, reader));
      }
    });
  }
});
