import { SiteShell } from '@/components/templates/site-shell';

/**
 * Signed-in pages drawn with the navbar on top. The check is in each page, not here, because a
 * layout does not run again when the client navigates between the pages under it.
 */
export default function TopNavLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell>{children}</SiteShell>;
}
