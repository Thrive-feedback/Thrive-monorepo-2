'use client';

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
 * page scrolls, from `md`. Where the browser can tie that to the scroll, CSS alone does it; this
 * says when the page has scrolled past the halfway mark for the browsers that cannot, and for
 * readers who would rather nothing moved.
 */
export function HomeTitle({ id }: HomeTitleProps) {
  const isSettled = useIsScrolledPast(HOME_SETTLE_MARK_ID);
  return (
    <Text
      as="h1"
      variant="display-1"
      id={id}
      tabIndex={id === undefined ? undefined : -1}
      data-settled={isSettled ? '' : undefined}
      className={styles.title}
    >
      Home
    </Text>
  );
}
