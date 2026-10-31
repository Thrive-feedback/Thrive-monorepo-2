import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';

/**
 * The largest size step that still fits, for a message up to each length: a card never scrolls, so
 * a long message is set smaller. Steps are `POSTCARD_SIZES`', smallest first, and the last entry
 * reaches the limit. Measured on the card on a phone and a wide screen, in all three fonts, on every
 * template, with Thai and with English: the words fill at most about 85% of the room, which leaves
 * some for the suggestions and a sticker.
 */
const LARGEST_STEP_FOR_LENGTH: readonly { upTo: number; step: number }[] = [
  { upTo: 80, step: 4 },
  { upTo: 130, step: 3 },
  { upTo: 200, step: 2 },
  { upTo: MAX_KUDOS_LENGTH, step: 1 },
];

/**
 * The step a message is set in. The Giver's choice is the largest it may be, and the length alone
 * steps it down, so every reader gets the same size from what is saved (ADR 0073).
 */
export function fittedSizeStep(sizeStep: number, length: number): number {
  const largest =
    LARGEST_STEP_FOR_LENGTH.find(({ upTo }) => length <= upTo)?.step ?? 1;
  return Math.min(sizeStep, largest);
}
