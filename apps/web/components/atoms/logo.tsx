import { cn } from '@/lib/cn.util';
import styles from './logo.module.css';

/**
 * The wordmark, in the shape exported unchanged from the design's logo page. Its colour is the
 * `--brand-wordmark` token, near-black on the light theme and white on the dark, so the component
 * never knows which theme is showing.
 */
export function Logo() {
  return (
    <span
      role="img"
      aria-label="Thrive"
      className={cn('block h-6 w-20', styles.wordmark)}
    />
  );
}
