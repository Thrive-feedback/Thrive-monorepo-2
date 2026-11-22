'use client';

import { ArrowUpIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/cn.util';

export type BackToTopProps = {
  /** The page's heading: the button shows once it has scrolled out of view, and takes focus back. */
  headingId: string;
};

/**
 * A round button at the window's lower right that takes the reader back to the top of a long page,
 * once its heading has scrolled out of view. Watched rather than measured on every scroll, so it
 * costs nothing while the page moves. It glides up unless motion is unwelcome, and moves focus to
 * the heading, so the keyboard starts again where the eye does. While hidden it is inert, so it is
 * neither pressed nor reached by Tab.
 */
export function BackToTop({ headingId }: BackToTopProps) {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const heading = document.getElementById(headingId);
    if (!heading) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setIsShown(entry ? !entry.isIntersecting : false);
    });
    observer.observe(heading);
    return () => observer.disconnect();
  }, [headingId]);

  function goBackToTop() {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    document.getElementById(headingId)?.focus({ preventScroll: true });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label="Back to top"
      inert={!isShown}
      onClick={goBackToTop}
      className={cn(
        'fixed right-4 bottom-4 z-30 size-11 shadow-high transition duration-quick motion-reduce:transition-none md:right-8 md:bottom-8',
        isShown ? 'opacity-100' : 'translate-y-3 opacity-0',
      )}
    >
      <ArrowUpIcon aria-hidden="true" className="size-5" />
    </Button>
  );
}
