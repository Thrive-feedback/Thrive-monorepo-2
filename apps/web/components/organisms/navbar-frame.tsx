import { cva, type VariantProps } from 'class-variance-authority';
import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { cn } from '@/lib/cn.util';
import styles from './glass.module.css';

const frame = cva(
  'z-40 flex h-18 shrink-0 items-center justify-between gap-gap-nav px-inset-container',
  {
    variants: {
      curve: {
        true: styles.curvesDown,
        false: '',
      },
      /**
       * What the bar is drawn on. `glass` is frosted, held at the top as the page scrolls under it.
       * `glassClearAtTop` is the same, but clear while the page sits at its top, for a page whose top
       * is its own. `clear` has no glass at all and is not held at the top: the page's ground runs
       * behind it and it scrolls away with the page, so nothing ever passes under a bar that has
       * nothing to hide it.
       */
      surface: {
        glass: cn('sticky top-0', styles.glass, styles.neutral),
        glassClearAtTop: cn(
          styles.clearAtTop,
          'sticky top-0',
          styles.glass,
          styles.neutral,
        ),
        clear: 'relative',
      },
    },
    defaultVariants: { curve: true, surface: 'glass' },
  },
);

export type NavbarFrameProps = VariantProps<typeof frame> & {
  /** Where the wordmark leads. */
  logoHref?: string;
  /** What sits after the wordmark: the bar's own controls, at its right end. */
  children?: React.ReactNode;
};

/**
 * The bar the signed-out screens share: untinted glass across the top, the wordmark at the left
 * and the caller's controls after it. It knows nothing of the session, so a page that must not
 * ask the API, such as the landing page, can stand on it too. `curve` tucks the page's corners
 * under the bar, for a page drawn as a sheet; a page that runs edge to edge leaves it off.
 * `surface` says what the bar is drawn on.
 */
export function NavbarFrame({
  logoHref,
  curve,
  surface,
  children,
}: NavbarFrameProps) {
  return (
    <header className={frame({ curve, surface })}>
      <NavbarLogo href={logoHref} />
      {children}
    </header>
  );
}
