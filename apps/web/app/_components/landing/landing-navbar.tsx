import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { NavbarFrame } from '@/components/organisms/navbar-frame';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';

/**
 * The landing page's bar: `SiteNavbar`'s frame, with Sign in where that one shows who is signed
 * in. It is not `SiteNavbar` itself because that asks the API for the session on every render,
 * and the landing page is for visitors who have none. The page runs edge to edge under it, so
 * the bar does not curve into it.
 */
export function LandingNavbar() {
  return (
    <NavbarFrame curve={false}>
      <nav aria-label="Main" className="flex items-center gap-gap-nav">
        <ThemeToggle />
        <Button asChild size="sm">
          <Link href={ROUTES.signIn}>{LANDING_COPY.nav.signIn}</Link>
        </Button>
      </nav>
    </NavbarFrame>
  );
}
