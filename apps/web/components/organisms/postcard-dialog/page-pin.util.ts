import type { PagePin } from './postcard-draft.type';

/**
 * Where a page stands in the screen that scrolls it: the top margin that would hold it there, how
 * far the screen has scrolled, and how tall the page is. Read as the writer switches style, so the
 * other style's page, on a new screen at the top, opens with its title exactly where this one's
 * was, however tall the two are. `null` when the page is not in a screen.
 */
export function pinOf(page: HTMLElement | null): PagePin | null {
  const screen = page?.parentElement;
  if (!page || !screen) {
    return null;
  }
  const paddingTop = Number.parseFloat(getComputedStyle(screen).paddingTop);
  const pageBox = page.getBoundingClientRect();
  // From the boxes, not `offsetTop`, which rounds to whole pixels and would shift the title by one.
  const fromScreenTop =
    pageBox.top - screen.getBoundingClientRect().top + screen.scrollTop;
  return {
    top: fromScreenTop - (Number.isNaN(paddingTop) ? 0 : paddingTop),
    scrollTop: screen.scrollTop,
    height: pageBox.height,
  };
}

/**
 * The page held where a switch found it, below which whatever is taller grows, and at least as tall
 * as the page it replaced, so its screen can scroll as far as that one had; centred otherwise.
 */
export function pinnedStyle(
  pin: PagePin | null,
): React.CSSProperties | undefined {
  return pin === null
    ? undefined
    : { marginTop: pin.top, marginBottom: 'auto', minHeight: pin.height };
}
