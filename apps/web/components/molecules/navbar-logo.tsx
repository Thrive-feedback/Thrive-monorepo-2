import Link from 'next/link';
import { Logo } from '@/components/atoms/logo';

/** The navbar's home link: the wordmark, back to the start. */
export function NavbarLogo() {
  return (
    <Link href="/" className="rounded-element">
      <Logo />
    </Link>
  );
}
