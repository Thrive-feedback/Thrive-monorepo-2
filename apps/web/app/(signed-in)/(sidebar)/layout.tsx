import { FeedbackStyleProvider } from '@/components/organisms/feedback-style-provider';
import { NotificationsProvider } from '@/components/organisms/notifications-provider';
import { MemberShell } from '@/components/templates/member-shell';
import { readFeedbackStyle } from '@/lib/feedback-style/feedback-style.service';
import { Navbar } from './_components/navbar';
import { Sidebar } from './_components/sidebar';
import { SidebarDrawer } from './_components/sidebar-drawer';

/**
 * Home and the pages beside it, Settings among them: the Member frame, with its own navbar, and
 * the sidebar set into the frame against its left edge, a column divided from the page by a line,
 * on a screen wide enough for it. Settings sets its own menu beside it as a second such column,
 * and below `xl` the sidebar narrows to its icons to make room. A phone has no room for the sidebar
 * beside the page, so the same sidebar opens there in a drawer from the navbar's menu button; the
 * button and the drawer share one drawer around the whole frame.
 * The check is in each page, not here, because a layout does not run again when the client
 * navigates between the pages under it.
 *
 * The page fills the frame, so the sidebar meets it on three sides, the navbar above, the strip to
 * its left and the strip below, and the column beside it runs to the strip on the right. Each page
 * keeps its own distance from those edges.
 *
 * The style the person writes Feedback in is read here, once, so the writing dialog and its switch
 * open in it from the first paint.
 */
export default async function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const feedbackStyle = await readFeedbackStyle();

  return (
    <FeedbackStyleProvider initialStyle={feedbackStyle}>
      {/* One read of what the person has been told, for the bell in the navbar and the counts in
      the sidebar and its drawer alike. */}
      <NotificationsProvider>
        <SidebarDrawer>
          <MemberShell navbar={<Navbar />} fillsFrame>
            <div className="flex flex-1">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">{children}</div>
            </div>
          </MemberShell>
        </SidebarDrawer>
      </NotificationsProvider>
    </FeedbackStyleProvider>
  );
}
