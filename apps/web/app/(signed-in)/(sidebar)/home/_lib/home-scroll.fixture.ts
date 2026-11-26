import { vi } from 'vitest';
import { dayAnchorOf } from '@/app/(signed-in)/(sidebar)/home/_components/home-feed-day';
import { MD_AND_UP } from '@/lib/breakpoint.constant';

/** A window as wide as a tablet or a desktop, from `md`, or as a phone. Undo with `vi.unstubAllGlobals()`. */
export function aWindow(isAtMd: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isAtMd && query === MD_AND_UP,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

type MarkEntry = {
  isIntersecting: boolean;
  boundingClientRect: { top: number };
};

/**
 * Stands in for the browser's observer of Home's marks, the strips whose foot leaves the window as
 * something sticks. Every mark on the page is told the same, as on a page scrolled that far. Undo
 * with `vi.unstubAllGlobals()`.
 */
export function watchMarks() {
  const told: ((entries: MarkEntry[]) => void)[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: MarkEntry[]) => void) {
        told.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  const tell = (entry: MarkEntry) => {
    for (const callback of told) {
      callback([entry]);
    }
  };
  return {
    /** All of each mark has left the window, or all of it is back. */
    hasStuck: (stuck: boolean) =>
      tell({
        isIntersecting: !stuck,
        boundingClientRect: { top: stuck ? -80 : 120 },
      }),
    /** Each mark is part way back: the page has scrolled up a little past the threshold. */
    isPartWayBack: () =>
      tell({ isIntersecting: true, boundingClientRect: { top: -30 } }),
  };
}

/** The list's days, newest first: the week ending Sunday 22 November, and one before it. */
export const LISTED_DAYS = [
  '2026-11-22',
  '2026-11-21',
  '2026-11-20',
  '2026-11-19',
  '2026-11-18',
  '2026-11-17',
  '2026-11-16',
  '2026-11-15',
] as const;

/** A box this far down the window, 400 tall and as wide as a phone. */
function boxAt(top: number): DOMRect {
  return {
    x: 0,
    y: top,
    left: 0,
    right: 390,
    width: 390,
    top,
    bottom: top + 400,
    height: 400,
    toJSON: () => ({}),
  };
}

/**
 * Scrolls the list until this day's section has just come to rest where a ribbon brings a day, as
 * the browser would lay it out: each day 400 tall, the newer ones above it out of the window. The
 * scroll is told as a browser tells it, at the document, bubbling to the window.
 */
export function scrollListTo(day: (typeof LISTED_DAYS)[number]) {
  const at = LISTED_DAYS.indexOf(day);
  LISTED_DAYS.forEach((one, index) => {
    const section = document.getElementById(dayAnchorOf(one));
    if (section) {
      const box = boxAt((index - at) * 400);
      section.getBoundingClientRect = () => box;
    }
  });
  document.dispatchEvent(new Event('scroll', { bubbles: true }));
}
