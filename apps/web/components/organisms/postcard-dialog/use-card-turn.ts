import { useState } from 'react';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import type { PostcardSide } from './postcard-draft.type';

/**
 * A card turning over in two halves: the side showing turns edge-on, the other side takes its place,
 * and turns back to face the reader. Goes on the element that turns, inside `styles.stage`. Pass
 * `onTurned` to hear when the card has finished.
 */
export function useCardTurn(side: PostcardSide, onTurned?: () => void) {
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
      // Told to turn again before this turn ended: that one has yet to start.
      if (side === shownSide) {
        onTurned?.();
      }
    }
  }

  return {
    shownSide,
    turnClassName: cn(
      phase === 'out' && styles.turnOut,
      phase === 'in' && styles.turnIn,
    ),
    handleAnimationEnd,
  };
}
