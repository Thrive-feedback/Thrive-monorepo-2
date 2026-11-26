'use client';

import { useEffect, useRef } from 'react';
import { HOME_SETTLE_MARK_ID } from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { useIsScrolledPast } from '@/app/(signed-in)/(sidebar)/home/_lib/use-is-scrolled-past';
import { Text } from '@/components/atoms/text';
import styles from './home-title.module.css';

export type HomeTitleProps = {
  /** For the button back to the top to send focus here; left out while the page loads. */
  id?: string;
};

/**
 * "Home", in the band's display size at the top of the page, settling to a page title's size as the
 * page scrolls, from `md`. Where the browser can tie that to the scroll, CSS alone moves it; this
 * says when the page has scrolled past the halfway mark for the browsers that cannot, and for
 * readers who would rather nothing moved.
 *
 * How much smaller the title is comes from the two type roles as the browser sets them: a page
 * title's size, read off a stand-in no one sees, over the heading's own. They step up together at
 * `md` and `lg`, so the stand-in is watched, and the ratio read again whenever its size changes.
 */
export function HomeTitle({ id }: HomeTitleProps) {
  const isSettled = useIsScrolledPast(HOME_SETTLE_MARK_ID);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const settledRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const settled = settledRef.current;
    if (!heading || !settled) {
      return;
    }
    function measure() {
      if (!heading || !settled) {
        return;
      }
      const big = Number.parseFloat(getComputedStyle(heading).fontSize);
      const small = Number.parseFloat(getComputedStyle(settled).fontSize);
      if (big > 0 && small > 0) {
        heading.style.setProperty('--settled-scale', String(small / big));
      }
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(settled);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Text
        ref={headingRef}
        as="h1"
        variant="display-1"
        id={id}
        tabIndex={id === undefined ? undefined : -1}
        data-settled={isSettled ? '' : undefined}
        className={styles.title}
      >
        Home
      </Text>
      <Text
        ref={settledRef}
        as="span"
        variant="display-5"
        aria-hidden="true"
        className="pointer-events-none invisible absolute"
      >
        Home
      </Text>
    </>
  );
}
