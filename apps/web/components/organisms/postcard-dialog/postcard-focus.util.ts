/** What has focus, if anything does: the page itself is not somewhere to send focus back to. */
export function focusedControl(): HTMLElement | null {
  const focused = document.activeElement;
  return focused instanceof HTMLElement && focused !== document.body
    ? focused
    : null;
}
