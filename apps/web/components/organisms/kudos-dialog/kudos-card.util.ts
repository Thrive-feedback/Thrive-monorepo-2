import { POSTCARD_SIZES } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';

/**
 * The date on the back of a card: `1 November 2026`. On the one clock the board's months are read
 * on, so a card given on the 1st is dated in the month it is filed under (ADR 0076), and the server
 * and the browser agree on it.
 */
const CARD_DATE = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'Asia/Bangkok',
});

export function kudosCardDate(isoDateTime: string): string {
  return CARD_DATE.format(new Date(isoDateTime));
}

/**
 * A first guess at the step a message fits in, from its length alone, for when nothing can be
 * measured yet: on the server and on the first paint. Steps are `POSTCARD_SIZES`', smallest first,
 * and the last entry reaches the limit. It is sized for the widest message, the Modern font with
 * Thai, so it is never larger than what is then measured (ADR 0092).
 */
const LARGEST_STEP_FOR_LENGTH: readonly { upTo: number; step: number }[] = [
  { upTo: 80, step: 4 },
  { upTo: 130, step: 3 },
  { upTo: 200, step: 2 },
  { upTo: MAX_KUDOS_LENGTH, step: 1 },
];

/** The guess, never larger than the step the Giver chose. */
export function guessedSizeStep(sizeStep: number, length: number): number {
  const largest =
    LARGEST_STEP_FOR_LENGTH.find(({ upTo }) => length <= upTo)?.step ?? 1;
  return Math.min(sizeStep, largest);
}

/** One step's size as a share of another's, by the sizes they have on a phone. */
export function shareOfSize(step: number, ofStep: number): number {
  const size = POSTCARD_SIZES[step]?.px;
  const of = POSTCARD_SIZES[ofStep]?.px;
  return size && of ? Math.min(size / of, 1) : 1;
}

/** How finely the share is searched for: about a tenth of a pixel on the largest size. */
const FIT_ROUNDS = 8;

/**
 * The largest share of the chosen size, from `smallest` up to all of it, at which the words fit,
 * found by halving: `fits` lays them out at a share and says whether they fit. When even `smallest`
 * does not, `smallest`, which a message within the limit always fits (ADR 0092).
 */
export function largestShareThatFits(
  fits: (share: number) => boolean,
  smallest: number,
): number {
  if (fits(1)) {
    return 1;
  }
  let low = smallest;
  let high = 1;
  for (let round = 0; round < FIT_ROUNDS; round += 1) {
    const middle = (low + high) / 2;
    if (fits(middle)) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return Math.round(low * 1000) / 1000;
}
