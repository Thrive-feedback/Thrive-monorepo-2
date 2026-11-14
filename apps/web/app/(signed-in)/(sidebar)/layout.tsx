import { MemberShell } from '@/components/templates/member-shell';
import { Navbar } from './_components/navbar';
import { Sidebar } from './_components/sidebar';

/**
 * Home and the pages beside it, Settings among them: the Member frame, with its own navbar, and
 * the sidebar set into the frame against its left edge, a column divided from the page by a line,
 * on a screen wide enough for it. Settings sets its own menu beside it as a second such column,
 * and below `xl` the sidebar narrows to its icons to make room. A phone has the sidebar's places
 * in a tab bar along the bottom instead, so the page leaves room above it.
 * The check is in each page, not here, because a layout does not run again when the client
 * navigates between the pages under it.
 *
 * The page fills the frame, so the sidebar meets it on three sides, the navbar above, the strip to
 * its left and the strip below, and the column beside it runs to the strip on the right. Each page
 * keeps its own distance from those edges.
 */
export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MemberShell navbar={<Navbar />} fillsFrame>
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
          {children}
        </div>
      </div>
    </MemberShell>
  );
}
