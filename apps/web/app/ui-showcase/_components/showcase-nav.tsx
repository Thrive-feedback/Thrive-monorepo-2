'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/components/atoms/link';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';

/** The showcase's pages beside Components, each its own address. */
const GALLERIES = [
  { href: ROUTES.uiShowcase.tokens, label: 'Tokens' },
  { href: ROUTES.uiShowcase.cards, label: 'Cards' },
  { href: ROUTES.uiShowcase.notifications, label: 'Notifications' },
  { href: ROUTES.uiShowcase.settings, label: 'Settings' },
] as const;

/**
 * Which page the address is on. Components covers the index and every component's own page,
 * which sit at `/ui-showcase/<component>` beside the galleries.
 */
function currentHref(pathname: string): string {
  return (
    GALLERIES.find((gallery) => gallery.href === pathname)?.href ??
    ROUTES.uiShowcase.index
  );
}

type NavLinkProps = {
  href: string;
  isCurrent: boolean;
  children: React.ReactNode;
};

function NavLink({ href, isCurrent, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isCurrent ? 'page' : undefined}
      className={cn(isCurrent && 'font-semibold text-fg-primary')}
    >
      {children}
    </Link>
  );
}

/**
 * The showcase's one bar, held at the top while a long page scrolls, so the other pages stay a
 * click away. The page you are on is marked, in words for a screen reader and in ink for the eye.
 */
export function ShowcaseNav() {
  const current = currentHref(usePathname());

  return (
    <header className="sticky top-0 z-40 border-border-default border-b bg-surface-base">
      <nav
        aria-label="Showcase"
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4"
      >
        <span className="font-semibold">Thrive UI</span>
        <NavLink
          href={ROUTES.uiShowcase.index}
          isCurrent={current === ROUTES.uiShowcase.index}
        >
          Components
        </NavLink>
        {GALLERIES.map(({ href, label }) => (
          <NavLink key={href} href={href} isCurrent={current === href}>
            {label}
          </NavLink>
        ))}
        <div className="ms-auto">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
