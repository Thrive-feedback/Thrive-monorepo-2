import { cva } from 'class-variance-authority';
import styles from '@/components/organisms/postcard-dialog/postcard.module.css';
import { PostcardPostmarkStill } from '@/components/organisms/postcard-dialog/postcard-postmark-still';
import type {
  AskedPostcard,
  ReadPostcard,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import {
  PostcardAnsweredBack,
  PostcardGivenBack,
} from '@/components/organisms/postcard-dialog/postcard-read-back';
import {
  PostcardAskReadOnly,
  PostcardSplitBack,
} from '@/components/organisms/postcard-dialog/postcard-split-back';
import {
  PostcardStampBoxReadOnly,
  PostcardStampReadOnly,
} from '@/components/organisms/postcard-dialog/postcard-stamp';
import { PostcardStickersReadOnly } from '@/components/organisms/postcard-dialog/postcard-sticker';
import { PAPER_TONES } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { cn } from '@/lib/cn.util';
import miniatureStyles from './postcard-miniature.module.css';

/** What differs by card: how it looks, when it was sent, and what is written on its back. */
function showing(card: ReadPostcard | AskedPostcard) {
  if (card.kind === 'asked') {
    return {
      look: card.ask,
      sentOn: card.sentOn,
      stickers: card.ask.stickers,
      // Nobody has answered, so the right half is as blank as the card the Givers were sent.
      back: (
        <PostcardSplitBack
          ask={
            <PostcardAskReadOnly
              ask={card.ask}
              messageTags={card.messageTags}
            />
          }
          answer={null}
        />
      ),
    };
  }
  if (card.kind === 'give') {
    return {
      look: card,
      sentOn: card.sentOn,
      stickers: card.stickers,
      back: <PostcardGivenBack card={card} />,
    };
  }
  const [answer] = card.answers;
  return {
    look: card.ask,
    sentOn: answer.sentOn,
    // The card's own first, as on the full card, so a later sticker sits on an earlier one.
    stickers: [...card.ask.stickers, ...answer.stickers],
    back: <PostcardAnsweredBack card={card} answer={answer} answerIndex={0} />,
  };
}

/** One side's worth of writing, drawn large because the card is scaled down so far. */
function WritingLines() {
  return (
    <span
      data-slot="writing-lines"
      className="flex min-w-0 flex-1 flex-col gap-8 p-10 pt-28"
    >
      <span className="h-5 w-3/4 rounded-full bg-border-muted" />
      <span className="h-5 rounded-full bg-border-muted" />
      <span className="h-5 w-5/6 rounded-full bg-border-muted" />
      <span className="h-5 w-1/2 rounded-full bg-border-muted" />
    </span>
  );
}

const stage = cva('', {
  variants: {
    size: {
      /** The width of whatever holds it, as in a box of a grid. */
      fill: 'w-full',
      /** In the corner of a card, beside who wrote it. */
      md: 'w-20 shrink-0',
      /** Beside what a card is about, where the postcard is what it is for. */
      lg: 'w-28 shrink-0 lg:w-36',
    },
  },
});

export type PostcardMiniatureProps = {
  /** A sent card, or a request nobody has answered yet. */
  card: ReadPostcard | AskedPostcard;
  /** How wide it is drawn. The whole card scales to it. */
  size?: 'fill' | 'md' | 'lg';
  /** What it opens is on its way: it fades and pulses, so a press does not look lost. */
  isPending?: boolean;
  className?: string;
};

/**
 * The back of a sent postcard, made small: its real paper, stamp, postmark and stickers. Its words
 * are the real ones where the card is large enough to keep its layout; the back lays itself out for
 * a phone below `md`, where the card is too small for them anyway, so lines stand in for them there.
 */
export function PostcardMiniature({
  card,
  size = 'fill',
  isPending = false,
  className,
}: PostcardMiniatureProps) {
  const { look, sentOn, stickers, back } = showing(card);

  return (
    <div
      aria-hidden="true"
      inert
      data-pending={isPending || undefined}
      className={cn(
        stage({ size }),
        miniatureStyles.stage,
        // A pulse only shows from full opacity. With less motion wanted, a still fade says it.
        isPending &&
          'opacity-60 motion-safe:animate-pulse motion-safe:opacity-100',
        className,
      )}
    >
      <div className={miniatureStyles.sheet}>
        <div
          className={cn(
            'relative flex aspect-3/2 flex-col overflow-hidden rounded-element border border-border-muted',
            styles.paper,
            PAPER_TONES[look.tone].className,
          )}
        >
          <div className="hidden min-h-0 flex-1 flex-col md:flex">{back}</div>
          <div className="flex min-h-0 flex-1 divide-x divide-border-muted md:hidden">
            <WritingLines />
            {card.kind === 'ask' && <WritingLines />}
            {card.kind === 'asked' && <span className="flex-1" />}
          </div>
          {look.stampKey ? (
            <PostcardStampReadOnly stampKey={look.stampKey} />
          ) : (
            <PostcardStampBoxReadOnly />
          )}
          <PostcardPostmarkStill date={sentOn} />
          <PostcardStickersReadOnly stickers={stickers} side="back" />
        </div>
      </div>
    </div>
  );
}
