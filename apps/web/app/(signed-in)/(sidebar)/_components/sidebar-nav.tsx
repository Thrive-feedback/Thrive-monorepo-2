'use client';

import {
  ClockIcon,
  HandHeartIcon,
  HouseIcon,
  InboxIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { isSettingsPath } from '@/app/(signed-in)/(sidebar)/_lib/settings-path.util';
import { SideNav, type SideNavEntry } from '@/components/molecules/side-nav';
import { useUnreadCounts } from '@/components/organisms/notifications-provider';
import { ROUTES } from '@/lib/routes.constant';

export type SidebarNavProps = {
  /** Whether Your dashboard is switched on for this deployment (ADR 0087). */
  showsDashboard: boolean;
};

/**
 * Where to go from Home. In Settings, below `xl`, it folds to its icons beside Settings' own menu.
 * It reads the path itself because the layout around it does not run again when the client
 * navigates between the pages under it.
 *
 * Waiting for me and Received carry how many unread lines of theirs the bell holds, read from the
 * bell's own poll, so a line read in the bell takes the number here down with it.
 */
export function SidebarNav({ showsDashboard }: SidebarNavProps) {
  const pathname = usePathname();
  const unread = useUnreadCounts();
  const items: readonly SideNavEntry[] = [
    { href: ROUTES.home, label: 'Home', Icon: HouseIcon },
    { href: ROUTES.kudos, label: 'Kudos board', Icon: HandHeartIcon },
    {
      href: ROUTES.waiting,
      label: 'Waiting for me',
      Icon: ClockIcon,
      count: unread.waiting,
    },
    { href: ROUTES.teammates, label: 'Teammates', Icon: UsersIcon },
    { heading: 'My Feedback' },
    ...(showsDashboard
      ? [
          {
            href: ROUTES.dashboard,
            label: 'Your dashboard',
            Icon: SparklesIcon,
          },
        ]
      : []),
    {
      href: ROUTES.received,
      label: 'Received',
      Icon: InboxIcon,
      count: unread.received,
    },
    { href: ROUTES.given, label: 'Given', Icon: SendIcon },
  ];

  return (
    <SideNav
      label="Main"
      items={items}
      currentHref={pathname}
      foldsToIcons={isSettingsPath(pathname)}
    />
  );
}
