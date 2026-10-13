import { SiteShell } from '@/components/templates/site-shell';

/** An invitation anyone with the link may open, signed in or not. */
export default function InvitationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell>{children}</SiteShell>;
}
