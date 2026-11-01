import { cva, type VariantProps } from 'class-variance-authority';
import { HandArrow } from '@/components/atoms/hand-arrow';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';

/**
 * How the note lies on the card. Each tilts towards the small postcard from where it sits, so its
 * arrow still points at it: one set low rises, one set high falls.
 */
const note = cva(
  'flex shrink-0 items-center gap-1 text-action-secondary-hover',
  {
    variants: {
      lie: {
        rising: 'translate-y-3 -rotate-6',
        falling: '-translate-y-3 rotate-6',
        easingUp: '-translate-x-2 translate-y-2 -rotate-3',
        easingDown: '-translate-x-3 -translate-y-2 rotate-3',
        level: '-translate-x-1 -rotate-1',
      },
    },
  },
);

export type FeedCardNoteLie = NonNullable<VariantProps<typeof note>['lie']>;

/** Every way the note can lie, for a card to take one of. */
export const FEED_CARD_NOTE_LIES: readonly FeedCardNoteLie[] = [
  'rising',
  'falling',
  'easingUp',
  'easingDown',
  'level',
];

/**
 * The way a card's note lies, picked from its id: it looks picked by hand, yet stays the same for
 * that card on the server, on the client and after a reload.
 */
export function noteLieOf(id: string): FeedCardNoteLie {
  // A rolling hash, because ids made moments apart share most of their characters: adding them up
  // gave a run of neighbours the same note.
  const hash = [...id].reduce(
    (total, character) => (total * 31 + (character.codePointAt(0) ?? 0)) >>> 0,
    0,
  );
  return FEED_CARD_NOTE_LIES[hash % FEED_CARD_NOTE_LIES.length] ?? 'level';
}

export type FeedCardNoteProps = {
  lie: FeedCardNoteLie;
  /** What opening the postcard gives. */
  children: React.ReactNode;
  className?: string;
};

/**
 * A few words by hand beside a card's small postcard, with an arrow to it. It only points the way,
 * so the link names the same thing and a screen reader skips this.
 */
export function FeedCardNote({ lie, children, className }: FeedCardNoteProps) {
  return (
    <span aria-hidden="true" className={cn(note({ lie }), className)}>
      <Text
        as="span"
        variant="subtitle-handwrite-3"
        className="w-20 text-right lg:w-22"
      >
        {children}
      </Text>
      <HandArrow className="h-4 w-8 lg:h-5 lg:w-12" />
    </span>
  );
}
