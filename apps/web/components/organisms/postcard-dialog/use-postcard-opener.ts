import { type RefObject, useRef } from 'react';
import { focusedControl } from './postcard-focus.util';

/**
 * Sends focus back to whatever had it when a card opened, unless the caller sends it somewhere of
 * its own. What opens one is not a `DialogTrigger`, so Radix would otherwise leave focus on the page
 * itself.
 *
 * The writing dialog swaps what it holds between its two styles, so it shares one opener across
 * them, and while a switch takes one style away (`isSwitchingRef`), that going is not a close: it
 * neither hands focus back nor tells the caller, and the dialog's own focus stays inside.
 */
export function usePostcardOpener(
  onCloseAutoFocus?: (event: Event) => void,
  shared?: {
    openerRef: RefObject<HTMLElement | null>;
    isSwitchingRef: RefObject<boolean>;
  },
) {
  const ownOpenerRef = useRef<HTMLElement | null>(null);
  const openerRef = shared?.openerRef ?? ownOpenerRef;

  function noteOpener() {
    openerRef.current = focusedControl();
  }

  function handleCloseAutoFocus(event: Event) {
    if (shared?.isSwitchingRef.current) {
      shared.isSwitchingRef.current = false;
      event.preventDefault();
      return;
    }
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
