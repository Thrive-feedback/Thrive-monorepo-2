import { HandArrow } from '@/components/atoms/hand-arrow';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { FEED_CARD_INK } from './feed-card-tone.constant';
import type { FeedCardTone } from './feed-card-tone.type';

/**
 * Where the note sits in the right column. On a phone the small card sits under what the card says,
 * at the right, so the note waits to its left and points across. Beside the words, the
 * column is narrow, so the note hangs over its top, past the card's edge, and points down. It is
 * written in the card's ink.
 */
const PLACE =
  'pointer-events-none absolute start-0 top-1/2 flex -translate-y-1/2 -rotate-3 select-none items-center gap-1 md:start-auto md:-end-2 md:-top-10 md:translate-y-0 md:flex-col md:gap-0';

export type FeedCardNoteProps = {
  /** Which kind of card it is on, as a colour. */
  tone: FeedCardTone;
  /** What pressing the small card gives. */
  children: React.ReactNode;
};

/**
 * A few words by hand with an arrow, pointing at the small card a card in a list is about, so a
 * reader sees that it is the thing to press. It only points the way, and the press says the same,
 * so it is a drawing: inert, and skipped by a screen reader.
 */
export function FeedCardNote({ tone, children }: FeedCardNoteProps) {
  return (
    <span aria-hidden="true" inert className={cn(PLACE, FEED_CARD_INK[tone])}>
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
