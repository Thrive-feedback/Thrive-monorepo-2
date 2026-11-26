'use client';

import { useEffect, useRef } from 'react';

export type RefocusWhenLostProps = {
  /** What the panel heading is named by, where focus goes when it is lost. */
  headingId: string;
  /** Where the 1:1 stands; a change of it may take away the control that was pressed. */
  stateKey: string;
};

/**
 * Pressing Accept, Start or Finish changes the panel, and the button pressed goes with it, which
 * drops a keyboard or screen-reader user onto the page itself. When where the 1:1 stands changes and
 * focus has been lost so, it goes to the panel's heading, which names what the panel now shows.
 * Focus somewhere else on purpose is left where it is.
 */
export function RefocusWhenLost({ headingId, stateKey }: RefocusWhenLostProps) {
  const seen = useRef(stateKey);
  useEffect(() => {
    if (seen.current === stateKey) {
      return;
    }
    seen.current = stateKey;
    const active = document.activeElement;
    if (active === null || active === document.body) {
      document.getElementById(headingId)?.focus();
    }
  }, [headingId, stateKey]);
  return null;
}
