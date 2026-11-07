import { MemberShell } from '@/components/templates/member-shell';
import { BrandNewNavbar } from './_components/brand-new-navbar';
import { BrandNewSidebar } from './_components/brand-new-sidebar';

/**
 * The new Home, built beside the pages Members use today: the same frame, with its own navbar,
 * and the sidebar set into the frame against its left edge, a column divided from the page by a
 * line as Settings divides its menu, on a screen wide enough for it. A phone gets neither sidebar
 * nor its replacement yet. The check is in each page, not here, because a layout does not run
 * again when the client navigates between the pages under it.
 *
 * The page fills the frame, so the sidebar meets it on three sides, the navbar above, the strip to
 * its left and the strip below, and the column beside it runs to the strip on the right. Each page
 * keeps its own distance from those edges. The sidebar's contents stay in view as the page scrolls,
 * stuck just below the navbar (`mt-18`).
 */
export default function BrandNewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MemberShell navbar={<BrandNewNavbar />} fillsFrame>
      <div className="flex flex-1">
        <aside
          aria-label="The new Home"
          className="hidden w-56 shrink-0 border-border-subtle border-r px-2 py-6 md:block"
        >
          <div className="sticky top-24">
            <BrandNewSidebar />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MemberShell>
  );
}
