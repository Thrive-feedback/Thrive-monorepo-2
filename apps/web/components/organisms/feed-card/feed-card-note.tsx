import { cva } from 'class-variance-authority';
import { HandArrow } from '@/components/atoms/hand-arrow';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { FEED_CARD_INK } from './feed-card-tone.constant';
import type { FeedCardTone } from './feed-card-tone.type';

/**
 * Where the note sits beside the small card. On a phone the small card sits under what the card says,
 * and the note stands beside it, the two centred together, pointing across. Beside the words, the
 * column is narrow, so the note stands just above the small card, as wide as it so their centres
 * line up, and points straight down at it, wherever the card sits in a tall row. It may run past the
 * card's edges. It is written in the card's ink.
 */
const place = cva(
  'pointer-events-none relative flex -rotate-3 select-none items-center gap-1 md:absolute md:inset-x-0 md:bottom-full md:mb-3.5 md:flex-col md:gap-0',
  {
    variants: {
      isPhoneOnly: { true: 'md:hidden', false: '' },
    },
    defaultVariants: { isPhoneOnly: false },
  },
);

export type FeedCardNoteProps = {
  /** Which kind of card it is on, as a colour. */
  tone: FeedCardTone;
  /** What pressing the small card gives. */
  children: React.ReactNode;
  /**
   * Drawn on a phone only. Where several small cards stand in one card, a phone shows each under its
   * own row, far apart, so each gets its note; beside the words they stand close, so one is enough.
   */
  isPhoneOnly?: boolean;
};

/**
 * A few words by hand with an arrow, pointing at the small card a card in a list is about, so a
 * reader sees that it is the thing to press. It only points the way, and the press says the same,
 * so it is a drawing: inert, and skipped by a screen reader.
 */
export function FeedCardNote({
  tone,
  children,
  isPhoneOnly = false,
}: FeedCardNoteProps) {
  return (
    <span
      aria-hidden="true"
      inert
      className={cn(place({ isPhoneOnly }), FEED_CARD_INK[tone])}
    >
      <Text
        as="span"
        variant="subtitle-handwrite-2"
        className="w-28 text-right md:w-auto md:whitespace-nowrap md:text-center"
      >
        {children}
      </Text>
      <HandArrow className="h-4 w-8 md:rotate-90" />
    </span>
  );
}
