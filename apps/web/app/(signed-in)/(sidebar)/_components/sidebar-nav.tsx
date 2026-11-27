'use client';

import {
  ChartColumnIcon,
  ClockIcon,
  HeartIcon,
  HouseIcon,
  InboxIcon,
  MessagesSquareIcon,
  SendIcon,
  UsersIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SideNav, type SideNavEntry } from '@/components/molecules/side-nav';
import { useUnreadCounts } from '@/components/organisms/notifications-provider';
import { ROUTES } from '@/lib/routes.constant';

export type SidebarNavProps = {
  /**
   * Whether Your dashboard is switched on for this deployment (ADR 0087). Off, it stays in the
   * menu as Coming soon, greyed and not a link.
   */
  showsDashboard: boolean;
  /** How many 1:1s wait on the person's answer, offered to them or asked of them. */
  oneOnOnesToAnswer: number;
};

/**
 * Where to go from Home. It folds to its icons whenever the sidebar is a rail. It reads the path
 * itself because the layout around it does not run again when the client navigates between the
 * pages under it.
 *
 * Waiting for me and Received carry how many unread lines of theirs the bell holds, read from the
 * bell's own poll, so a line read in the bell takes the number here down with it. Tools are what a
 * person works with beside Feedback, 1:1s first.
 */
export function SidebarNav({
  showsDashboard,
  oneOnOnesToAnswer,
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
      href: ROUTES.dashboard,
      label: 'Your dashboard',
      Icon: ChartColumnIcon,
      unavailableNote: showsDashboard ? undefined : 'Coming soon',
    },
    {
      href: ROUTES.received,
      label: 'Received',
      Icon: InboxIcon,
      count: unread.received,
    },
    { href: ROUTES.given, label: 'Given', Icon: SendIcon },
    { heading: 'Tools' },
    {
      href: ROUTES.oneOnOnes,
      label: '1:1s',
      Icon: MessagesSquareIcon,
      count: oneOnOnesToAnswer,
      countSaid: 'to answer',
    },
  ];

  return (
    <SideNav label="Main" items={items} currentHref={pathname} foldsToIcons />
  );
}
