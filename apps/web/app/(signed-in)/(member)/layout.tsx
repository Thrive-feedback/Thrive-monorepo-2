import { MemberShell } from '@/components/templates/member-shell';

/**
 * Every page a Member uses, drawn with the Member navbar. The check is in each page, not here,
 * because a layout does not run again when the client navigates between the pages under it.
 */
export default function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MemberShell>{children}</MemberShell>;
}
