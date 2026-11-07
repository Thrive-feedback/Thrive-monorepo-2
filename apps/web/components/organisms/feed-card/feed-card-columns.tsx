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
 * line turns across, such a row has no right column at all, and the small card keeps to the right so
 * its note has room to point at it from the left. It holds that note, which may run past it.
 */
const asideColumn = cva(
  'relative shrink-0 items-center justify-end border-surface-base md:flex md:w-36 md:justify-center md:border-s-2 md:ps-5 lg:w-40',
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
  /** The card it is about, made small, centred top to bottom in the right column. */
  aside?: React.ReactNode;
  /** A note by hand pointing at that card, drawn by `FeedCardNote`. */
  note?: React.ReactNode;
  /** What it says, in the left column. */
  children: React.ReactNode;
};

/**
 * One row of a card's two columns: what it says on the left and the card it is about on the right,
 * parted by a line in the page's colour. On a phone the line turns across and the card sits under
 * what it says. A card about one thing is one row; a card holding several, such as a request and
 * its answers, is a row for each.
 */
export function FeedCardRow({ aside, note, children }: FeedCardRowProps) {
  const isEmpty = aside === undefined;

  return (
    <div className="flex flex-col md:flex-row">
      <div className={mainColumn({ isAsideEmpty: isEmpty })}>{children}</div>
      <div className={asideColumn({ isEmpty })}>
        {note}
        {aside}
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
      <FeedCardRow
        aside={aside}
        note={note && <FeedCardNote tone={tone}>{note}</FeedCardNote>}
      >
        {children}
      </FeedCardRow>
    </FeedCardSurface>
  );
}
