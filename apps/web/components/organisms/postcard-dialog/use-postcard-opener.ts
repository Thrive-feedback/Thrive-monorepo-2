import { useRef } from 'react';
import { focusedControl } from './postcard-focus.util';

/**
 * Sends focus back to whatever had it when a card opened, unless the caller sends it somewhere of
 * its own. What opens one is not a `DialogTrigger`, so Radix would otherwise leave focus on the page
 * itself.
 */
export function usePostcardOpener(onCloseAutoFocus?: (event: Event) => void) {
  const openerRef = useRef<HTMLElement | null>(null);

  function noteOpener() {
    openerRef.current = focusedControl();
  }

  function handleCloseAutoFocus(event: Event) {
    onCloseAutoFocus?.(event);
    if (event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    if (openerRef.current?.isConnected) {
      openerRef.current.focus();
    }
  }

  return { noteOpener, handleCloseAutoFocus };
}
