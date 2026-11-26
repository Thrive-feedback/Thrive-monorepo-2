import { useEffect, useState } from 'react';

/**
 * Whether the element of this id has scrolled up out of the window, read as the page moves. Watched
 * rather than measured on every scroll, so it costs nothing while the page moves. Out of view below
 * the window is not past it, as on a short window before anything has scrolled. False until the
 * browser has first said, and false where no such element is.
 */
export function useIsScrolledPast(id: string): boolean {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setIsPast(
        entry
          ? !entry.isIntersecting && entry.boundingClientRect.top < 0
          : false,
      );
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [id]);

  return isPast;
}
