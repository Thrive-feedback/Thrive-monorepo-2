import { SiteShell } from '@/components/templates/site-shell';

/** Pages anyone may open, signed in or not. */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell>{children}</SiteShell>;
}
