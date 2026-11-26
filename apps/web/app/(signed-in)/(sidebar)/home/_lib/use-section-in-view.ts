import { useEffect, useState } from 'react';

/** How far past its resting line a section may lie and still be read as resting there. */
const REST_SLACK = 1;

/** The line an element comes to rest on when it is scrolled into view: its scroll margin. */
function restingLineOf(element: HTMLElement): number {
  return (
    (Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0) +
    REST_SLACK
  );
}

/**
 * Which of the elements of these ids the page has scrolled to: the one lying across the line it
 * would come to rest on if it were brought into view, its scroll margin below the window's top. So
 * a section brought into view is at once the one scrolled to, and the next takes over as its top
 * reaches the same line. `null` where none does: above the first, below the last, or between them
 * in something else.
 *
 * Read at most once a frame while the page scrolls, and only while watching, since it measures;
 * `null` while not watching. The sections share one scroll margin, read from the first of them as
 * watching starts and again when the window is resized, since it changes only at a breakpoint. Only
 * the page's own scroll is heard, so scrolling inside a menu or a dialog over the page reads nothing.
 */
export function useSectionInView(
  ids: readonly string[],
  isWatching: boolean,
): string | null {
  const [inView, setInView] = useState<string | null>(null);
  // The ids as one value, so a new array of the same ids does not start watching again.
  const key = ids.join(' ');

  useEffect(() => {
    if (!isWatching) {
      setInView(null);
      return;
    }
    const watched = key.split(' ');
    let line: number | null = null;
    let frame = 0;
    const read = () => {
      frame = 0;
      setInView(
        watched.find((id) => {
          const element = document.getElementById(id);
          if (!element) {
            return false;
          }
          line ??= restingLineOf(element);
          const { top, bottom } = element.getBoundingClientRect();
          return top <= line && bottom > line;
        }) ?? null,
      );
    };
    const readSoon = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(read);
      }
    };
    const readAfterResize = () => {
      line = null;
      readSoon();
    };
    read();
    window.addEventListener('scroll', readSoon, { passive: true });
    window.addEventListener('resize', readAfterResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', readSoon);
      window.removeEventListener('resize', readAfterResize);
    };
  }, [key, isWatching]);

  return inView;
}
