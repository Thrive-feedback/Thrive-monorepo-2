import { type RefObject, useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { isEscapeTakenInside } from './postcard-focus.util';

export type UseCardTextToolsOptions = {
  messageRef: RefObject<HTMLTextAreaElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  toolbarRef: RefObject<HTMLDivElement | null>;
};

/** When a card's bar shows the text tools, and where the cursor goes when they leave it. */
export function useCardTextTools({
  messageRef,
  contentRef,
  toolbarRef,
}: UseCardTextToolsOptions) {
  const [isEditingText, setIsEditingText] = useState(false);

  // Done takes the text tools away, so the cursor goes to the first of the usual tools that works,
  // or, where none works yet, as on an answer, to the first one, rather than being lost with them.
  const handleDone = useCallback(() => {
    flushSync(() => setIsEditingText(false));
    const tools = toolbarRef.current;
    (
      tools?.querySelector<HTMLElement>('button:not([aria-disabled="true"])') ??
      tools?.querySelector<HTMLElement>('button')
    )?.focus();
  }, [toolbarRef]);

  // The cursor anywhere but the message or the bars leaves the text tools; those stop their own
  // focus, menus included, from getting here.
  function handleFocus(event: React.FocusEvent) {
    if (event.target !== messageRef.current) {
      setIsEditingText(false);
    }
  }

  // A press on the bar between its tools takes no focus, so the text tools stay up.
  function handleToolbarMouseDown(event: React.MouseEvent) {
    if (
      event.target instanceof Element &&
      !event.target.closest('button, input, label, [role="menuitem"]')
    ) {
      event.preventDefault();
    }
  }

  /** Escape while styling leaves the text tools; otherwise it asks before closing, like Close. */
  function handleEscape(askToClose: () => void) {
    if (isEscapeTakenInside(messageRef.current, contentRef.current)) {
      return;
    }
    if (isEditingText) {
      setIsEditingText(false);
    } else {
      askToClose();
    }
  }

  return {
    isEditingText,
    setIsEditingText,
    handleDone,
    handleFocus,
    handleToolbarMouseDown,
    handleEscape,
  };
}
