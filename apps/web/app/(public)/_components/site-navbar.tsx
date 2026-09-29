import Link from 'next/link';
import { Logo } from './logo';

/**
 * Logo only. The design also draws "Log in" and "Create Organization" here; they are left out
 * on purpose, because sign-in is the page itself and creating an organization is not offered.
 */
export function SiteNavbar() {
  return (
    <header className="flex h-18 shrink-0 items-center px-4 md:px-10">
      <Link href="/" className="rounded-control">
        <Logo />
      </Link>
    </header>
  );
}
