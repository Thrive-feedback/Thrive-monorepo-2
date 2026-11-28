'use client';

import {
  ChartColumnIcon,
  ClipboardCheckIcon,
  ClockIcon,
  HeartIcon,
  HistoryIcon,
  HouseIcon,
  InboxIcon,
  MessagesSquareIcon,
  SendIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SideNav, type SideNavEntry } from '@/components/molecules/side-nav';
import { useUnreadCounts } from '@/components/organisms/notifications-provider';
import { ROUTES } from '@/lib/routes.constant';

export type SidebarNavProps = {
  /**
   * Whether Your dashboard is switched on for this deployment (ADR 0087). Off, it stays in the
   * menu as Under construction, greyed and not a link.
   */
  showsDashboard: boolean;
  /** How many 1:1s wait on the person's answer, offered to them or asked of them. */
  oneOnOnesToAnswer: number;
  /** Whether the person runs the Workspace, and so sees People analytics. */
  isAdmin: boolean;
};

/**
 * Where to go from Home. It folds to its icons whenever the sidebar is a rail. It reads the path
 * itself because the layout around it does not run again when the client navigates between the
 * pages under it.
 *
 * Waiting for me and Received carry how many unread lines of theirs the bell holds, read from the
 * bell's own poll, so a line read in the bell takes the number here down with it. Tools are what a
 * person works with beside Feedback, 1:1s first. People analytics is the Workspace seen whole, so
 * only an admin has it; none of its places is open yet.
 */
export function SidebarNav({
  showsDashboard,
  oneOnOnesToAnswer,
  isAdmin,
}: SidebarNavProps) {
  const pathname = usePathname();
  const unread = useUnreadCounts();
  const items: readonly SideNavEntry[] = [
    { href: ROUTES.home, label: 'Home', Icon: HouseIcon },
    { href: ROUTES.kudos, label: 'Kudos board', Icon: HeartIcon },
    {
      href: ROUTES.waiting,
      label: 'Waiting for me',
      Icon: ClockIcon,
      count: unread.waiting,
    },
    { href: ROUTES.teammates, label: 'Teammates', Icon: UsersIcon },
    { heading: 'My Feedback' },
    {
      href: ROUTES.received,
      label: 'Received',
      Icon: InboxIcon,
      count: unread.received,
    },
    { href: ROUTES.given, label: 'Given', Icon: SendIcon },
    showsDashboard
      ? {
          href: ROUTES.dashboard,
          label: 'Your dashboard',
          Icon: ChartColumnIcon,
        }
      : {
          label: 'Your dashboard',
          Icon: ChartColumnIcon,
          upcoming: 'under-construction',
        },
    { heading: 'Tools' },
    {
      href: ROUTES.oneOnOnes,
      label: '1:1s',
      Icon: MessagesSquareIcon,
      count: oneOnOnesToAnswer,
      countSaid: 'to answer',
    },
    { label: 'Retrospective', Icon: HistoryIcon, upcoming: 'idea' },
    ...(isAdmin
      ? ([
          { heading: 'People analytics' },
          { label: 'Insights', Icon: TrendingUpIcon, upcoming: 'idea' },
          {
            label: 'Performance review',
            Icon: ClipboardCheckIcon,
            upcoming: 'under-construction',
          },
        ] as const)
      : []),
  ];

  return (
    <SideNav label="Main" items={items} currentHref={pathname} foldsToIcons />
  );
}
