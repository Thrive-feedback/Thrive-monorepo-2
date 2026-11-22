import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { metricsClassName } from '@/components/organisms/postcard-dialog/postcard-message-style.util';
import { cn } from '@/lib/cn.util';
import { messageLength } from '@/lib/feedback/message-length.util';
import styles from './kudos-card.module.css';
import {
  guessedSizeStep,
  largestShareThatFits,
  shareOfSize,
} from './kudos-card.util';
import type { KudosTextStyle } from './kudos-template.constant';

export type FittedSizeOptions = {
  textStyle: KudosTextStyle;
  /** The words as typed. Measured as they are, unless `wordsRef` shows how they are drawn. */
  text: string;
  /** The words as drawn, names and all, for a card that draws them otherwise than as typed. */
  wordsRef?: RefObject<HTMLElement | null>;
};

/**
 * How large a Kudos is set: the largest share of the size chosen, down to the smallest step, at
 * which its words fit the room they are written in (ADR 0092). `roomRef` goes on that room, and
 * `style` on it too, where `styles.fitted` on the words reads the share. The words are laid out
 * unseen on a copy in the room, measured and taken away again before anything is drawn, so nothing
 * is left behind for a reader or a screen reader to find. Measured again whenever the words or their
 * style change, or the room changes size, which a font arriving or a narrower window both do.
 */
export function useFittedSize({
  textStyle,
  text,
  wordsRef,
}: FittedSizeOptions) {
  const roomRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  const { font, sizeStep, align } = textStyle;

  useLayoutEffect(() => {
    const room = roomRef.current;
    if (!room) {
      return;
    }
    const measure = () => {
      const drawn = wordsRef?.current;
      const ruler = drawn
        ? (drawn.cloneNode(true) as HTMLElement)
        : document.createElement('p');
      if (!drawn) {
        // A paragraph drops a last empty line, which a textarea keeps.
        ruler.textContent = `${text}​`;
      }
      ruler.setAttribute('aria-hidden', 'true');
      ruler.className = cn(
        'pointer-events-none invisible absolute inset-x-0 top-0 whitespace-pre-wrap break-words',
        metricsClassName({ font, sizeStep, align }),
        styles.fitted,
        styles.tags,
      );
      room.append(ruler);
      // Layout sizes, not drawn ones: a card being read is scaled as one piece, and both scale alike.
      const height = room.clientHeight;
      const share = largestShareThatFits(
        (tried) => {
          ruler.style.setProperty('--kudos-fit', String(tried));
          return ruler.offsetHeight <= height;
        },
        shareOfSize(0, sizeStep),
      );
      ruler.remove();
      setMeasured(share);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    return () => observer.disconnect();
  }, [text, wordsRef, font, sizeStep, align]);

  const share =
    measured ??
    shareOfSize(guessedSizeStep(sizeStep, messageLength(text)), sizeStep);
  return {
    roomRef,
    style: { '--kudos-fit': share } as React.CSSProperties,
  };
}
