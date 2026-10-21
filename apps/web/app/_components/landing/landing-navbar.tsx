import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { NavbarFrame } from '@/components/organisms/navbar-frame';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';

const { nav } = LANDING_COPY;

/**
 * The landing page's bar: `SiteNavbar`'s frame, with the language, the colour mode and Sign in.
 * It is not `SiteNavbar` itself because that asks the API for the session on every render, and the
 * landing page is for visitors who have none. The page runs edge to edge under it, so the bar does
 * not curve into it, and stays clear over the hero until the page scrolls.
 */
export function LandingNavbar() {
  return (
    <NavbarFrame curve={false} clearAtTop>
      <nav aria-label="Main" className="flex items-center gap-gap-nav">
        <LanguageSwitch />
        <ThemeToggle />
        <Button asChild size="sm">
          <Link href={ROUTES.signIn}>{nav.signIn}</Link>
        </Button>
      </nav>
    </NavbarFrame>
  );
}

/** The bar appears once per page, so one fixed id names Thai's description. */
const THAI_COMING_ID = 'landing-thai-coming';

/**
 * English and Thai, as `ADR-0038` puts them on the bar. Only English exists so far, so English is
 * marked as the language shown and Thai is a disabled button that says it is coming; nothing here
 * switches anything until the web app has Thai (#48).
 */
function LanguageSwitch() {
  return (
    <fieldset className="flex items-center rounded-full border border-border-muted p-0.5 text-button-xs">
      <legend className="sr-only">{nav.languageLabel}</legend>
      <span
        aria-current="true"
        className="rounded-full bg-action-neutral-surface-hover px-2.5 py-1 text-fg-primary"
      >
        {nav.english}
      </span>
      <button
        type="button"
        disabled
        title={nav.thaiComing}
        aria-describedby={THAI_COMING_ID}
        className="rounded-full px-2.5 py-1 text-fg-disabled"
      >
        {nav.thai}
      </button>
      <span id={THAI_COMING_ID} hidden>
        {nav.thaiComing}
      </span>
    </fieldset>
  );
}
