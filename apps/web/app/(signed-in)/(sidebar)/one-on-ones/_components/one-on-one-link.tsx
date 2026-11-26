'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ROUTES } from '@/lib/routes.constant';

/** Set by a press of a 1:1 in the list, so the panel it opens takes focus once it is drawn. */
const FOCUS_KEY = 'one-on-ones:focus-panel';

export type OneOnOneLinkProps = {
  oneOnOneId: string;
  isOpen: boolean;
  className: string;
  children: React.ReactNode;
};

/**
 * One 1:1 in the list, as a link, so the open one is in the address. A press marks that the panel
 * should take focus when it arrives, so a keyboard or screen-reader user lands on what they chose
 * rather than staying in the list with the page changed under them.
 */
export function OneOnOneLink({
  oneOnOneId,
  isOpen,
  className,
  children,
}: OneOnOneLinkProps) {
  return (
    <Link
      href={ROUTES.oneOnOneWith(oneOnOneId)}
      aria-current={isOpen ? 'page' : undefined}
      scroll={false}
      className={className}
      onClick={() => {
        try {
          sessionStorage.setItem(FOCUS_KEY, oneOnOneId);
        } catch {
          // Without storage the panel simply keeps focus where it was.
        }
      }}
    >
      {children}
    </Link>
  );
}

export type FocusOnArriveProps = {
  oneOnOneId: string;
  /** The id of the heading to focus, which carries `tabIndex={-1}`. */
  headingId: string;
};

/**
 * Moves focus to the open 1:1's heading when it was opened from the list. A page reached any other
 * way, by a link or a reload, leaves focus where the browser puts it.
 */
export function FocusOnArrive({ oneOnOneId, headingId }: FocusOnArriveProps) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FOCUS_KEY) !== oneOnOneId) {
        return;
      }
      sessionStorage.removeItem(FOCUS_KEY);
    } catch {
      return;
    }
    document.getElementById(headingId)?.focus({ preventScroll: true });
  }, [oneOnOneId, headingId]);
  return null;
}
