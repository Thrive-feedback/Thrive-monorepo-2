import { cva, type VariantProps } from 'class-variance-authority';
import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { cn } from '@/lib/cn.util';
import styles from './glass.module.css';

const frame = cva(
  'sticky top-0 z-40 flex h-18 shrink-0 items-center justify-between gap-gap-nav px-inset-container',
  {
    variants: {
      curve: {
        true: styles.curvesDown,
        false: '',
      },
      clearAtTop: {
        true: styles.clearAtTop,
        false: '',
      },
    },
    defaultVariants: { curve: true, clearAtTop: false },
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
 * `clearAtTop` keeps the bar clear until the page scrolls, for a page whose top is its own.
 */
export function NavbarFrame({
  logoHref,
  curve,
  clearAtTop,
  children,
}: NavbarFrameProps) {
  return (
    <header
      className={cn(frame({ curve, clearAtTop }), styles.glass, styles.neutral)}
    >
      <NavbarLogo href={logoHref} />
      {children}
    </header>
  );
}
