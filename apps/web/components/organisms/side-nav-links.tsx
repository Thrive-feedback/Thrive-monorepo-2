'use client';

import { usePathname } from 'next/navigation';
import { Link as TextLink } from '@/components/atoms/link';
import { ROUTES } from '@/lib/routes.constant';

/**
 * The product navigation, in the order a person meets it: ask, then chase, then answer, then the
 * Workspace's settings.
 */
const LINKS: readonly { readonly href: string; readonly label: string }[] = [
  { href: ROUTES.home, label: 'Home' },
  { href: ROUTES.feedback.sent, label: 'My requests' },
  { href: ROUTES.feedback.asks, label: 'Waiting for me' },
  { href: ROUTES.settings.index, label: 'Settings' },
];

/**
 * `page` on the link's own page, and `true` on a page beneath it — Settings' categories — so the
 * person still sees which section they are in, and a screen reader is not told it is this page.
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
 * The signed-in navigation, marking the page the person is on. A client component because
 * only the browser knows the current path — a server component would have to be told, and
 * every page would have to remember to tell it.
 */
export function SideNavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="flex items-center gap-gap-nav md:flex-col md:items-start"
    >
      {LINKS.map((link) => (
        <TextLink
          key={link.href}
          href={link.href}
          aria-current={currentness(link.href, pathname)}
        >
          {link.label}
        </TextLink>
      ))}
    </nav>
  );
}
