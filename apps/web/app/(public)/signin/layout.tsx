import { SiteShell } from '@/components/templates/site-shell';

/** Sign-in stands on its own: no navbar, since the page itself names Thrive and is the way in. */
export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell hasNavbar={false}>{children}</SiteShell>;
}
