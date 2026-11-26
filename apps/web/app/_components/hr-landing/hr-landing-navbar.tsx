import Link from 'next/link';
import { AudienceSwitch } from '@/app/_components/audience-switch';
import { Button } from '@/components/atoms/button';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { NavbarFrame } from '@/components/organisms/navbar-frame';
import { ROUTES } from '@/lib/routes.constant';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { nav, demoHref } = HR_LANDING_COPY;

/**
 * The front page's bar: the same frame as the page for teams, with the switch between the two
 * pages, and Book a demo as its one strong button. Sign in and the FAQ step back on a phone, where
 * the closing section carries them.
 */
export function HrLandingNavbar() {
  return (
    <NavbarFrame curve={false} surface="glassClearAtTop">
      <nav aria-label="Main" className="flex items-center gap-gap-nav">
        <AudienceSwitch current="hr" />
        <Link
          href={`#${HR_LANDING_COPY.faq.id}`}
          className="hidden text-fg-secondary text-label hover:text-fg-primary md:inline"
        >
          {nav.faq}
        </Link>
        <ThemeToggle />
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
        >
          <Link href={ROUTES.signIn}>{nav.signIn}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={demoHref}>{nav.demo}</Link>
        </Button>
      </nav>
    </NavbarFrame>
  );
}
