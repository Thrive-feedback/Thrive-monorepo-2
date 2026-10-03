import { SiteShell } from '@/components/templates/site-shell';

/**
 * Pages only a signed-in person may open. The check is in each page, not here, because a
 * layout does not run again when the client navigates between the pages under it.
 */
export default function SignedInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell>{children}</SiteShell>;
}
