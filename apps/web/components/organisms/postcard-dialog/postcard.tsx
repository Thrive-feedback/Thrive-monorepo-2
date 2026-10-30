import { useState } from 'react';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import { PostcardCover } from './postcard-cover';
import type { PostcardSide } from './postcard-draft.type';
import { PAPER_TONES, type PaperTone } from './postcard-style.constant';

const faceClassName =
  'col-start-1 row-start-1 relative flex min-h-96 flex-col overflow-hidden rounded-element border border-border-muted md:aspect-3/2 md:min-h-0';

export type PostcardProps = {
  /** The side to show. A change turns the card over to it. */
  side: PostcardSide;
  tone: PaperTone;
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  templateKey: string;
  /** What is stuck on each side, above everything else on it, writing included. */
  stamps: Readonly<Record<PostcardSide, React.ReactNode>>;
  /** What is written on the back. */
  children: React.ReactNode;
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
  stamps,
  children,
}: PostcardProps) {
  const [shownSide, setShownSide] = useState(side);
  const [phase, setPhase] = useState<'still' | 'out' | 'in'>('still');

  // A new side starts the turn; the side showing only changes once the card is edge-on.
  if (side !== shownSide && phase === 'still') {
    setPhase('out');
  }

  function handleAnimationEnd(event: React.AnimationEvent) {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (phase === 'out') {
      setShownSide(side);
      setPhase('in');
    } else {
      setPhase('still');
    }
  }

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
        className={cn(
          'grid',
          phase === 'out' && styles.turnOut,
          phase === 'in' && styles.turnIn,
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        <section
          aria-label="Front of the postcard"
          aria-hidden={shownSide !== 'front'}
          inert={shownSide !== 'front'}
          className={classNameFor('front')}
        >
          <PostcardCover templateKey={templateKey} />
          {stamps.front}
        </section>
        <section
          aria-label="Back of the postcard"
          aria-hidden={shownSide !== 'back'}
          inert={shownSide !== 'back'}
          className={classNameFor('back')}
        >
          {children}
          {stamps.back}
        </section>
      </div>
    </div>
  );
}
