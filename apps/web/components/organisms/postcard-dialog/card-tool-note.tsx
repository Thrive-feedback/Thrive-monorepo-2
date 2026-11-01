'use client';

import { useContext } from 'react';
import { HandArrow } from '@/components/atoms/hand-arrow';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { cn } from '@/lib/cn.util';
import { CardNotesContext } from './card-notes';
import { SENT_AWAY } from './postcard-editor.constant';

export type CardToolNoteProps = {
  /** Where it sits, against the tool it points at. */
  className?: string;
  /** Turns the arrow, which otherwise points right, towards that tool. */
  arrowClassName?: string;
  /** The card has gone, so this fades with everything else around it. */
  hasGone?: boolean;
  children: React.ReactNode;
};

/**
 * A word by hand on the overlay beside a card being written, saying how to use one of its tools,
 * with an arrow to that tool. A screen reader skips it: every tool it points at names itself. It
 * shows only where there is room beside the card, and not once the writer has turned the notes off.
 */
export function CardToolNote({
  className,
  arrowClassName,
  hasGone = false,
  children,
}: CardToolNoteProps) {
  const areNotesShown = useContext(CardNotesContext);
  if (!areNotesShown) {
    return null;
  }

  return (
    <HandwrittenNote
      size="md"
      tilt="left"
      writes="on-open"
      className={cn(
        'hidden items-center gap-1 lg:flex',
        className,
        hasGone && SENT_AWAY,
      )}
    >
      <span>{children}</span>
      <HandArrow className={cn('h-4 w-8', arrowClassName)} />
    </HandwrittenNote>
  );
}
