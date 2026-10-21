export function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

/**
 * Scrolls the column that holds the preview's Home tabs so the tabs sit as high in it as it goes,
 * and never scrolls the page. Home stacks the tabs under the composer, below the window's fold.
 * Of Home's two layouts CSS shows one, so the tabs that are laid out are the ones to reveal.
 */
export function scrollTabsIntoColumn(
  preview: HTMLElement,
  behavior: ScrollBehavior,
) {
  const tabs = Array.from(
    preview.querySelectorAll<HTMLElement>('nav[aria-label="Feedback"]'),
  ).find((element) => element.offsetParent !== null);
  let column = tabs?.parentElement ?? null;
  while (
    column &&
    column !== preview &&
    !/auto|scroll/.test(getComputedStyle(column).overflowY)
  ) {
    column = column.parentElement;
  }
  if (!tabs || !column || column === preview) return;
  // Stops short by the column's own top padding, so the tabs keep the inset the window gives them.
  const inset = Number.parseFloat(getComputedStyle(column).paddingTop) || 0;
  column.scrollTo({
    top:
      column.scrollTop +
      tabs.getBoundingClientRect().top -
      column.getBoundingClientRect().top -
      inset,
    behavior,
  });
}
