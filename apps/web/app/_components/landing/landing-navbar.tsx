import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import styles from '@/components/organisms/glass.module.css';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';

/**
 * The landing page's bar: the same glass as `SiteNavbar`, with Sign in where that one shows who
 * is signed in. It is not `SiteNavbar` because that asks the API for the session on every
 * render, and the landing page is for visitors who have none.
 */
export function LandingNavbar() {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-18 shrink-0 items-center justify-between px-inset-container',
        styles.glass,
        styles.neutral,
        styles.curvesDown,
      )}
    >
      <NavbarLogo />
      <nav aria-label="Main" className="flex items-center gap-gap-nav">
        <ThemeToggle />
        <Button asChild size="sm">
          <Link href={ROUTES.signIn}>{LANDING_COPY.nav.signIn}</Link>
        </Button>
      </nav>
    </header>
  );
}
