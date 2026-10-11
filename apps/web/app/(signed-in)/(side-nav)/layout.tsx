import { SideNavShell } from '@/components/templates/side-nav-shell';

/**
 * Signed-in pages drawn with the side nav rather than the navbar. The check is in each page,
 * not here, because a layout does not run again when the client navigates between the pages
 * under it.
 */
export default function SideNavLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SideNavShell>{children}</SideNavShell>;
}
