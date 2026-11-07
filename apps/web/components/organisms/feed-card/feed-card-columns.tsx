import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';
import { FeedCardNote } from './feed-card-note';
import { FEED_CARD_SURFACE } from './feed-card-surface.constant';
import { FEED_CARD_GROUND } from './feed-card-tone.constant';
import type { FeedCardTone } from './feed-card-tone.type';

/**
 * The right column, one width on every card so the lines run straight down a list, with room above
 * and below a small card so those in rows one after another never touch. A row with nothing in it
 * still draws the line, so the line runs unbroken down a card of several rows; on a phone, where the
 * line turns across, such a row has no right column at all, and the small card and its note stand
 * side by side in the middle of the card. It holds that note, which may run past it.
 */
const asideColumn = cva(
  'relative shrink-0 items-center justify-center border-surface-base md:flex md:w-36 md:border-s-2 md:ps-5 lg:w-40',
  {
    variants: {
      isEmpty: {
        true: 'hidden',
        false: 'flex border-t-2 pt-5 pb-3 md:border-t-0 md:py-3',
      },
    },
  },
);

/** Centred top to bottom, as the small card beside it is, so the two read as one line. */
const mainColumn = cva(
  'flex min-w-0 flex-1 flex-col justify-center gap-3 md:pe-6',
  {
    variants: {
      isAsideEmpty: { true: '', false: 'pb-5 md:pb-0' },
    },
  },
);

export type FeedCardRowProps = {
  /** Which kind of card it is, as a colour, which its note is written in. */
  tone: FeedCardTone;
  /** The card it is about, made small, centred top to bottom in the right column. */
  aside?: React.ReactNode;
  /** A few words by hand pointing at that card, saying what pressing it gives. */
  note?: string;
  /** Whether the note is drawn on a phone only, as `FeedCardNote` describes. */
  isNotePhoneOnly?: boolean;
  /** What it says, in the left column. */
  children: React.ReactNode;
};

/**
 * One row of a card's two columns: what it says on the left and the card it is about on the right,
 * parted by a line in the page's colour. On a phone the line turns across and the card sits under
 * what it says. A card about one thing is one row; a card holding several, such as a request and
 * its answers, is a row for each.
 */
export function FeedCardRow({
  tone,
  aside,
  note,
  isNotePhoneOnly,
  children,
}: FeedCardRowProps) {
  const isEmpty = aside === undefined;

  return (
    <div className="flex flex-col md:flex-row">
      <div className={mainColumn({ isAsideEmpty: isEmpty })}>{children}</div>
      <div className={asideColumn({ isEmpty })}>
        {/* The note is placed against the small card, not the column, so it points at the card
            however tall the row beside it grows. */}
        <div className="relative flex items-center gap-3">
          {note && (
            <FeedCardNote tone={tone} isPhoneOnly={isNotePhoneOnly}>
              {note}
            </FeedCardNote>
          )}
          {aside}
        </div>
      </div>
    </div>
  );
}

export type FeedCardSurfaceProps = {
  /** Which kind of card it is, as a colour. */
  tone: FeedCardTone;
  /** Its rows. */
  children: React.ReactNode;
};

/** The ground of a card in a list, in its kind's colour. */
export function FeedCardSurface({ tone, children }: FeedCardSurfaceProps) {
  return (
    <article
      className={cn(
        FEED_CARD_SURFACE,
        FEED_CARD_GROUND[tone],
        'relative gap-0',
      )}
    >
      {children}
    </article>
  );
}

export type FeedCardColumnsProps = {
  /** Which kind of card it is, as a colour. */
  tone: FeedCardTone;
  /** The card it is about, made small, in the column on the right. */
  aside: React.ReactNode;
  /** A few words by hand pointing at that card, saying what pressing it gives. */
  note?: string;
  /** Who, what and when, in the column on the left. */
  children: React.ReactNode;
};

/** The shape every card in a list about one thing takes: one row of the two columns. */
export function FeedCardColumns({
  tone,
  aside,
  note,
  children,
}: FeedCardColumnsProps) {
  return (
    <FeedCardSurface tone={tone}>
      <FeedCardRow tone={tone} aside={aside} note={note}>
        {children}
      </FeedCardRow>
    </FeedCardSurface>
  );
}
