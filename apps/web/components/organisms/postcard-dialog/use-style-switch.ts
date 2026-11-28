import { type RefObject, useRef } from 'react';
import { pinnedStyle, pinOf } from './page-pin.util';
import type { StyleSwitching, WrittenSoFar } from './postcard-draft.type';
import { SWITCHED_IN } from './postcard-editor.constant';

/**
 * The style switch as either editor of the writing dialog wears it: the switch's own props, what
 * the page and the screen take so a switched-in editor shows no entrance and its title stays where
 * the other's was, and how it takes focus as it arrives.
 */
export function useStyleSwitch({
  switching,
  contentRef,
  pageRef,
  writtenSoFar,
}: {
  switching: StyleSwitching;
  /** The screen that scrolls the page. */
  contentRef: RefObject<HTMLElement | null>;
  pageRef: RefObject<HTMLElement | null>;
  writtenSoFar: () => WrittenSoFar;
}) {
  const switchRef = useRef<HTMLButtonElement>(null);

  function handleChoose() {
    // This editor is about to go: its going is not the dialog closing.
    switching.isSwitchingRef.current = true;
    switching.onSwitch(writtenSoFar(), pinOf(pageRef.current));
  }

  /**
   * As the dialog's content opens: an editor switched in scrolls its new screen to where the other
   * had scrolled and keeps the cursor on the switch. Says whether it took care of focus.
   */
  function arriveSwitchedIn(event: Event): boolean {
    if (!switching.isSwitchedIn) {
      return false;
    }
    event.preventDefault();
    const screen = contentRef.current;
    if (screen && switching.pin) {
      screen.scrollTop = switching.pin.scrollTop;
    }
    switchRef.current?.focus({ preventScroll: true });
    return true;
  }

  return {
    switchProps: { ref: switchRef, onChoose: handleChoose },
    arriveSwitchedIn,
    pageStyle: pinnedStyle(switching.pin),
    switchedInClassName: switching.isSwitchedIn ? SWITCHED_IN : undefined,
    opener: {
      openerRef: switching.openerRef,
      isSwitchingRef: switching.isSwitchingRef,
    },
  };
}
