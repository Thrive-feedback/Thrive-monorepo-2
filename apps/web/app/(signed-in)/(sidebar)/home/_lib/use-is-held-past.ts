import { useEffect, useState } from 'react';

/**
 * Whether the element of this id has scrolled up out of the window, and stays so until all of it is
 * back below the window's top. Reading it the moment its last line leaves and the moment its first
 * returns, rather than at one line both ways, means scrolling a little up and down at the threshold
 * does not flip it back and forth: the element's own height is the margin. Watched rather than
 * measured on every scroll. False until the browser has first said, and false where no such element
 * is.
 */
export function useIsHeldPast(id: string): boolean {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setIsPast(true);
        } else if (entry.boundingClientRect.top >= 0) {
          setIsPast(false);
        }
      },
      // Told as it starts and finishes leaving, and as it starts and finishes coming back.
      { threshold: [0, 1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [id]);

  return isPast;
}
