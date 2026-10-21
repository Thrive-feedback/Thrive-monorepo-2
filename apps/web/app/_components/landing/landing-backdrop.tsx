import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';
import styles from './landing-backdrop.module.css';

const orb = cva('absolute rounded-full', {
  variants: {
    depth: {
      far: cn(styles.far, 'size-80 md:size-160'),
      mid: cn(styles.mid, 'size-64 md:size-120'),
      near: cn(styles.near, 'size-48 md:size-80'),
    },
    tint: {
      primary: 'bg-action-primary opacity-25',
      secondary: 'bg-action-secondary opacity-25',
      // The page's own ink, faint: a light grey haze on the light theme, a soft white on the dark.
      neutral: 'bg-fg-primary opacity-10',
    },
  },
});

/**
 * Where each orb sits, how deep it is, and its colour. They keep to the margins either side of
 * the page's column, and the nearer ones start below the fold so the scroll brings them up.
 */
const ORBS = [
  { depth: 'far', tint: 'primary', at: '-top-40 -left-40' },
  { depth: 'mid', tint: 'secondary', at: 'top-1/4 -right-40' },
  { depth: 'far', tint: 'neutral', at: 'top-1/2 -left-60' },
  { depth: 'near', tint: 'primary', at: 'top-3/4 -right-20' },
  { depth: 'mid', tint: 'neutral', at: 'top-full -right-60' },
  { depth: 'near', tint: 'secondary', at: 'top-full -left-20' },
  { depth: 'near', tint: 'neutral', at: 'top-3/2 left-1/3' },
  { depth: 'mid', tint: 'primary', at: 'top-3/2 -left-40' },
] as const;

/**
 * The landing page's ground: soft circles of light in the brand's purple and orange and in the
 * page's own ink, blurred and drifting behind the page at three depths as it scrolls. Pure
 * decoration, fixed behind everything, never in the way of a pointer or a screen reader.
 */
export function LandingBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {ORBS.map(({ depth, tint, at }) => (
        <span
          key={`${depth}-${tint}-${at}`}
          className={cn(orb({ depth, tint }), at)}
        />
      ))}
    </div>
  );
}
