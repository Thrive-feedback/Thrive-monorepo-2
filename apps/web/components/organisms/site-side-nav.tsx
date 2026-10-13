import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import {
  readSession,
  readSessionNeedsRefresh,
} from '@/lib/session/session.service';
import { SessionRefresher } from './session-refresher';
import { SideNavLinks } from './side-nav-links';
import { SignOutForm } from './sign-out-form';

/**
 * The navbar's items stood on end, for the signed-in pages: the logo and the product
 * navigation at the top, the light/dark switch and Sign out at the bottom. Below `md` there is
 * no room for a column, so it lies flat as the same bar the navbar draws, and needs no menu
 * button to open.
 *
 * The links know which page they are on themselves, which is why they are a client component.
 */
export async function SiteSideNav() {
  const [session, needsRefresh] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
  ]);

  return (
    <header className="flex h-18 shrink-0 items-center justify-between gap-gap-nav px-inset-container md:sticky md:top-0 md:h-dvh md:w-60 md:flex-col md:items-stretch md:justify-start md:gap-gap-section md:border-border-subtle md:border-e md:py-6">
      <NavbarLogo />
      {needsRefresh && <SessionRefresher />}
      {session && <SideNavLinks />}
      <div className="flex items-center gap-gap-nav md:mt-auto md:justify-between">
        <ThemeToggle />
        {session && <SignOutForm />}
      </div>
    </header>
  );
}
