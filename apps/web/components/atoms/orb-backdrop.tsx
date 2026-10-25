import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';
import styles from './orb-backdrop.module.css';

const orb = cva(cn('absolute', styles.orb), {
  variants: {
    depth: {
      far: cn(styles.far, 'size-130 md:size-210'),
      mid: cn(styles.mid, 'size-104 md:size-160'),
      near: cn(styles.near, 'size-78 md:size-110'),
    },
    tint: {
      primary: cn(styles.primary, 'opacity-25'),
      secondary: cn(styles.secondary, 'opacity-25'),
      neutral: cn(styles.neutral, 'opacity-10'),
    },
  },
});

/**
 * Where each orb sits, how deep it is, and its colour. They keep to the margins either side of
 * the page's column. On a long `page` the nearer ones start below the fold so the scroll brings
 * them up; a `screen` that fits the window keeps all of them at its corners, in the brand's two colours
 * only, since the ink's grey haze reads as a smudge without a long page to spread over; where they
 * reach under a panel, its glass catches their colour.
 */
const ORBS = {
  page: [
    { depth: 'far', tint: 'primary', at: '-top-40 -left-40' },
    { depth: 'mid', tint: 'secondary', at: 'top-1/4 -right-40' },
    { depth: 'far', tint: 'neutral', at: 'top-1/2 -left-60' },
    { depth: 'near', tint: 'primary', at: 'top-3/4 -right-20' },
    { depth: 'mid', tint: 'neutral', at: 'top-full -right-60' },
    { depth: 'near', tint: 'secondary', at: 'top-full -left-20' },
    { depth: 'near', tint: 'neutral', at: 'top-3/2 left-1/3' },
    { depth: 'mid', tint: 'primary', at: 'top-3/2 -left-40' },
  ],
  screen: [
    { depth: 'far', tint: 'primary', at: '-top-60 -left-50' },
    { depth: 'mid', tint: 'secondary', at: 'top-1/3 -right-50' },
    { depth: 'near', tint: 'primary', at: '-bottom-30 -right-10' },
    { depth: 'near', tint: 'secondary', at: '-bottom-50 -left-30' },
  ],
} as const;

export type OrbBackdropProps = {
  /** `page` for one that scrolls through several screens, `screen` for one that fits the window. */
  spread: keyof typeof ORBS;
};

/**
 * The signed-out ground: soft circles of light in the brand's purple and orange and in the
 * page's own ink, drifting behind the page at three depths as it scrolls. Pure decoration, fixed
 * behind everything, never in the way of a pointer or a screen reader.
 */
export function OrbBackdrop({ spread }: OrbBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {ORBS[spread].map(({ depth, tint, at }) => (
        <span
          key={`${depth}-${tint}-${at}`}
          className={cn(orb({ depth, tint }), at)}
        />
      ))}
    </div>
  );
}
