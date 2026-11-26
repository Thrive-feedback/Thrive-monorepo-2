'use client';

import { ArrowUpIcon } from 'lucide-react';
import { useIsHeldPast } from '@/app/(signed-in)/(sidebar)/home/_lib/use-is-held-past';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/cn.util';

export type BackToTopProps = {
  /** The page's heading, which takes focus back. */
  headingId: string;
  /**
   * What the reader must have scrolled past for the button to show. Not the heading, which may stay
   * in view as the page scrolls.
   */
  pastId: string;
};

/**
 * A round button at the window's lower right that takes the reader back to the top of a long page,
 * once the page's head has scrolled away. It glides up unless motion is unwelcome, and moves focus to
 * the heading, so the keyboard starts again where the eye does. While hidden it is inert, so it is
 * neither pressed nor reached by Tab.
 */
export function BackToTop({ headingId, pastId }: BackToTopProps) {
  const isShown = useIsHeldPast(pastId);

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
        'fixed right-4 bottom-4 z-30 size-11 shadow-high transition duration-medium ease-smooth-out motion-reduce:transition-none md:right-8 md:bottom-8',
        isShown ? 'opacity-100' : 'translate-y-3 opacity-0',
      )}
    >
      <ArrowUpIcon aria-hidden="true" className="size-5" />
    </Button>
  );
}
