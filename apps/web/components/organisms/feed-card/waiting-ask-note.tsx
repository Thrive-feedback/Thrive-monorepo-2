import { cva, type VariantProps } from 'class-variance-authority';
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

export type WaitingAskNoteLie = NonNullable<VariantProps<typeof note>['lie']>;

/** Every way the note can lie, for a card to take one of. */
export const WAITING_ASK_NOTE_LIES: readonly WaitingAskNoteLie[] = [
  'rising',
  'falling',
  'easingUp',
  'easingDown',
  'level',
];

/**
 * The way an Ask's note lies, picked from its id: it looks picked by hand, yet stays the same for
 * that Ask on the server, on the client and after a reload.
 */
export function noteLieOf(askId: string): WaitingAskNoteLie {
  // A rolling hash, because ids made moments apart share most of their characters: adding them up
  // gave a run of neighbours the same note.
  const hash = [...askId].reduce(
    (total, character) => (total * 31 + (character.codePointAt(0) ?? 0)) >>> 0,
    0,
  );
  return WAITING_ASK_NOTE_LIES[hash % WAITING_ASK_NOTE_LIES.length] ?? 'level';
}

export type WaitingAskNoteProps = {
  lie: WaitingAskNoteLie;
};

/**
 * "Answer in the postcard", written by hand beside the small postcard with an arrow to it. It only
 * points the way, so the link names the same words and a screen reader skips this.
 */
export function WaitingAskNote({ lie }: WaitingAskNoteProps) {
  return (
    <span aria-hidden="true" className={cn(note({ lie }))}>
      <Text
        as="span"
        variant="subtitle-handwrite-3"
        className="w-20 text-right lg:w-22"
      >
        Answer in the postcard
      </Text>
      <svg
        aria-hidden="true"
        viewBox="0 0 48 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-8 shrink-0 lg:h-5 lg:w-12"
      >
        <path d="M2 11c8-5 14 3 22-1s12-2 21-1" />
        <path d="M38 3l7 6-8 6" />
      </svg>
    </span>
  );
}
