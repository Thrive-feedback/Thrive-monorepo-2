'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAnsweredAsks } from './answered-asks';
import { WAITING_HEADING_ID } from './waiting-heading.constant';

export type WaitingAskGoneProps = {
  askId: string;
  /** The list in the order it was opened from. */
  closeHref: string;
};

/**
 * What the address names when there is nothing left to answer, as when a card was answered in
 * another tab. A redirect would take the person to the top of the list and leave the card on it, so
 * the card goes from where it stands, as an answered one does, and the cursor it held goes to the
 * title. Opened straight from the address, nothing has the cursor, and that stays so.
 */
export function WaitingAskGone({ askId, closeHref }: WaitingAskGoneProps) {
  const router = useRouter();
  const { markAnswered } = useAnsweredAsks();

  useEffect(() => {
    if (document.activeElement !== document.body) {
      document
        .getElementById(WAITING_HEADING_ID)
        ?.focus({ preventScroll: true });
    }
    markAnswered(askId);
    router.replace(closeHref, { scroll: false });
    router.refresh();
  }, [askId, closeHref, markAnswered, router]);

  return null;
}
