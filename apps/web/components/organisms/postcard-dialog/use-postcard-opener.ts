import { useRef } from 'react';
import { focusedControl } from './postcard-focus.util';

/**
 * Sends focus back to whatever had it when a postcard opened. What opens one is not a
 * `DialogTrigger`, so Radix would otherwise leave focus on the page itself.
 */
export function usePostcardOpener() {
  const openerRef = useRef<HTMLElement | null>(null);

  function noteOpener() {
    openerRef.current = focusedControl();
  }

  /** Back to the opener, if that is still on the page. */
  function giveFocusBack(event: Event) {
    event.preventDefault();
    if (openerRef.current?.isConnected) {
      openerRef.current.focus();
    }
  }

  return { noteOpener, giveFocusBack };
}
