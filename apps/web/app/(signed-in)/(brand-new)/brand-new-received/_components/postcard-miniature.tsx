import styles from '@/components/organisms/postcard-dialog/postcard.module.css';
import { PostcardPostmarkStill } from '@/components/organisms/postcard-dialog/postcard-postmark-still';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import {
  PostcardAnsweredBack,
  PostcardGivenBack,
} from '@/components/organisms/postcard-dialog/postcard-read-back';
import {
  PostcardStampBoxReadOnly,
  PostcardStampReadOnly,
} from '@/components/organisms/postcard-dialog/postcard-stamp';
import { PostcardStickersReadOnly } from '@/components/organisms/postcard-dialog/postcard-sticker';
import { PAPER_TONES } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { cn } from '@/lib/cn.util';
import miniatureStyles from './postcard-miniature.module.css';

/** What differs by card: how it looks, when it was sent, and what is written on its back. */
function showing(card: ReadPostcard) {
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

export type PostcardMiniatureProps = {
  card: ReadPostcard;
};

/**
 * The back of a sent postcard, made small: its real paper, stamp, postmark and stickers. Its words
 * are the real ones where the card is large enough to keep its layout; the back lays itself out for
 * a phone below `md`, where the card is too small for them anyway, so lines stand in for them there.
 */
export function PostcardMiniature({ card }: PostcardMiniatureProps) {
  const { look, sentOn, stickers, back } = showing(card);

  return (
    <div
      aria-hidden="true"
      inert
      className={cn('w-full', miniatureStyles.stage)}
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
