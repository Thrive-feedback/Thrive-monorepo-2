'use client';

import { useEffect } from 'react';
import { useNavigationCountActions } from '@/components/organisms/notifications-provider';

/**
 * Tells the bell that Waiting for me is open, so the lines about being asked are read: every Ask
 * they point at is on this page. The count beside Waiting for me stays, since it is the Asks still
 * waiting, which only answering takes down.
 *
 * Draws nothing. Sent from the browser once the page is on screen, rather than while the server
 * draws it: a link prefetched ahead of a press draws the page too, and would read lines nobody saw.
 */
export function WaitingOpened() {
  const { markPlaceOpened } = useNavigationCountActions();

  useEffect(() => {
    markPlaceOpened('waiting');
  }, [markPlaceOpened]);

  return null;
}
