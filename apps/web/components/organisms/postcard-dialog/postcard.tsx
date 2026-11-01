import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import { PostcardCover } from './postcard-cover';
import type { PostcardSide } from './postcard-draft.type';
import { PAPER_TONES, type PaperTone } from './postcard-style.constant';
import { useCardTurn } from './use-card-turn';

const faceClassName =
  'col-start-1 row-start-1 relative flex min-h-96 flex-col overflow-hidden rounded-element border border-border-muted md:aspect-3/2 md:min-h-0';

export type PostcardProps = {
  /** The side to show. A change turns the card over to it. */
  side: PostcardSide;
  tone: PaperTone;
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  templateKey: string;
  /** The stickers on each side, above everything else on it, writing included. */
  stickers: Readonly<Record<PostcardSide, React.ReactNode>>;
  /** The stamp, or the box printed for one, in the corner of the back, clear of the writing. */
  stamp: React.ReactNode;
  /** What is written on the back. */
  children: React.ReactNode;
  /** Leaves the stickers off for now, on both sides, so what lies under them can be seen. */
  areStickersHidden?: boolean;
  /** The card has finished turning over. */
  onTurned?: () => void;
};

/**
 * A landscape postcard: a picture on the front, the message on the back. Both sides share one
 * place, so the card keeps its size as it turns; the side not showing is hidden and inert, so
 * only the side showing can be reached.
 */
export function Postcard({
  side,
  tone,
  templateKey,
  stickers,
  stamp,
  children,
  areStickersHidden = false,
  onTurned,
}: PostcardProps) {
  const { shownSide, turnClassName, handleAnimationEnd } = useCardTurn(
    side,
    onTurned,
  );

  function classNameFor(faceSide: PostcardSide) {
    return cn(
      faceClassName,
      styles.paper,
      PAPER_TONES[tone].className,
      shownSide !== faceSide && 'invisible',
    );
  }

  return (
    <div className={styles.stage}>
      <div
        className={cn('grid', turnClassName)}
        onAnimationEnd={handleAnimationEnd}
      >
        <section
          aria-label="Front of the postcard"
          aria-hidden={shownSide !== 'front'}
          inert={shownSide !== 'front'}
          className={classNameFor('front')}
        >
          <PostcardCover templateKey={templateKey} />
          {!areStickersHidden && stickers.front}
        </section>
        <section
          aria-label="Back of the postcard"
          aria-hidden={shownSide !== 'back'}
          inert={shownSide !== 'back'}
          className={classNameFor('back')}
        >
          {children}
          {stamp}
          {!areStickersHidden && stickers.back}
        </section>
      </div>
    </div>
  );
}
