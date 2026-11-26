import { cn } from '@/lib/cn.util';
import styles from './hanging-band.module.css';

/**
 * The space above what the band holds: the navbar's height, since the band starts under it, and a
 * clear gap more, so what it holds does not sit against the bar.
 */
export const BAND_TOP_SPACE = 'pt-24';

export type HangingBandProps = {
  /** `header` on the page itself; `div` for a stand-in while the page loads. */
  as?: 'header' | 'div';
  className?: string;
  children: React.ReactNode;
};

/**
 * The head of a page that hangs from the navbar, a Profile's or Home's: a band in the frame's tint,
 * lit by the window's soft plum, blue and orange light, its foot perforated like a sheet of stamps.
 * It is marked so the navbar paints the band's ground rather than glass, and the two read as one.
 *
 * Nothing that wraps it may carry a transform, a filter, `will-change`, `contain` or a
 * `backdrop-filter`: any of them makes the wrapper the box the light is held to, and the light
 * would then scroll with the page. What must reach past the band's foot or stay in view as it
 * scrolls, such as Home's composer and heading, stands beside it, never inside it, since the band's
 * mask cuts everything it holds and nothing inside it can stick past it.
 */
export function HangingBand({
  as: Element = 'header',
  className,
  children,
}: HangingBandProps) {
  return (
    <Element data-hangs-from-navbar="" className={cn(styles.band, className)}>
      {children}
    </Element>
  );
}

export type HangingBandFootProps = {
  /** Its height and where it stands, which are the page's. */
  className?: string;
};

/**
 * The band's foot on its own, with the same ground, light and bites, for a page to keep under the
 * navbar once the band has scrolled away, as Home does behind its composer. It stands after the band,
 * at the band's full width, so its bites fall where the band's do. Decoration, hidden from screen
 * readers and from the pointer.
 */
export function HangingBandFoot({ className }: HangingBandFootProps) {
  return <div aria-hidden="true" className={cn(styles.foot, className)} />;
}

export type HangingBandGroundProps = {
  /** Its size and where it stands, which are the page's. */
  className?: string;
};

/**
 * The band's ground on its own, the same light and tint with no bites, behind what a page keeps in
 * view over the band while the band scrolls under it, as Home does behind its heading. Lying on the
 * band it cannot be told from it. Decoration, hidden from screen readers and from the pointer.
 */
export function HangingBandGround({ className }: HangingBandGroundProps) {
  return <div aria-hidden="true" className={cn(styles.ground, className)} />;
}
