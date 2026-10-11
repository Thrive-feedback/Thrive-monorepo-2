'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/atoms/logo';
import { ROUTES } from '@/lib/routes.constant';

/**
 * The navbar's home link. The sign-in page names Thrive with the wordmark in its own heading,
 * so the navbar leaves its copy out there; an empty box of the same size keeps the rest of the
 * bar where it was.
 */
export function NavbarLogo() {
  if (usePathname() === ROUTES.signIn) {
    return <span aria-hidden="true" className="h-6 w-20" />;
  }
  return (
    <Link href="/" className="rounded-element">
      <Logo />
    </Link>
  );
}
