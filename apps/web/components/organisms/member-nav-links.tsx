'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/routes.constant';

/** The product navigation. Everything else a Member reaches is in the account menu. */
const LINKS: readonly { readonly href: string; readonly label: string }[] = [
  { href: ROUTES.home, label: 'Home' },
];

/**
 * `page` on the link's own page, and `true` on a page beneath it, so the person still sees which
 * section they are in, and a screen reader is not told it is this page.
 */
function currentness(
  href: string,
  pathname: string,
): 'page' | 'true' | undefined {
  if (pathname === href) {
    return 'page';
  }
  return pathname.startsWith(`${href}/`) ? 'true' : undefined;
}

/**
 * The navbar's links, marking the one the person is on. A client component because only the
 * browser knows the current path — a server component would have to be told, and every page
 * would have to remember to tell it.
 */
export function MemberNavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {LINKS.map((link) => (
        <NextLink
          key={link.href}
          href={link.href}
          aria-current={currentness(link.href, pathname)}
          className="rounded-button px-3 py-2 text-button-sm text-fg-secondary hover:bg-action-neutral-surface hover:text-fg-primary aria-[current]:bg-action-primary-surface aria-[current]:text-action-primary"
        >
          {link.label}
        </NextLink>
      ))}
    </nav>
  );
}
