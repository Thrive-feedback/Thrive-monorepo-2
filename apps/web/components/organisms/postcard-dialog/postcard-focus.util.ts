/**
 * Whether Escape belongs to something open inside a card rather than to the card: the suggestions
 * for a tag being typed, which close by the field's own handler, or a drawer, which Radix would
 * otherwise hear first and ask to close the card.
 */
export function isEscapeTakenInside(
  message: HTMLElement | null,
  content: HTMLElement | null,
) {
  return (
    message?.hasAttribute('aria-controls') === true ||
    content?.querySelector('[data-slot="drawer-popup"][data-open]') != null
  );
}

/** What has focus, if anything does: the page itself is not somewhere to send focus back to. */
export function focusedControl(): HTMLElement | null {
  const focused = document.activeElement;
  return focused instanceof HTMLElement && focused !== document.body
    ? focused
    : null;
}
