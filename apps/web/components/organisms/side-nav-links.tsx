'use client';

import { usePathname } from 'next/navigation';
import { Link as TextLink } from '@/components/atoms/link';
import { ROUTES } from '@/lib/routes.constant';

/** The product navigation, in the order a person meets it: ask, then chase, then answer. */
const LINKS: readonly { readonly href: string; readonly label: string }[] = [
  { href: ROUTES.home, label: 'Home' },
  { href: ROUTES.feedback.sent, label: 'My requests' },
  { href: ROUTES.feedback.asks, label: 'Waiting for me' },
];

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
          {...(pathname === link.href && { 'aria-current': 'page' })}
        >
          {link.label}
        </TextLink>
      ))}
    </nav>
  );
}
