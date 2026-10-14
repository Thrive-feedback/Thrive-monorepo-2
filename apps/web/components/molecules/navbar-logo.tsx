import Link from 'next/link';
import { Logo } from '@/components/atoms/logo';
import { ROUTES } from '@/lib/routes.constant';

export type NavbarLogoProps = {
  /** Where the wordmark leads: the landing page unless the person has a Home to go to. */
  href?: string;
};

/** The navbar's home link: the wordmark, back to the start. */
export function NavbarLogo({ href = ROUTES.landing }: NavbarLogoProps) {
  return (
    <Link href={href} className="rounded-element">
      <Logo />
    </Link>
  );
}
