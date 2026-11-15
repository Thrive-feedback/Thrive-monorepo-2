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
import { SHARED_COUNT_SAID } from '@/app/(signed-in)/(sidebar)/_lib/shared-count-said.constant';
import { SideNav, type SideNavEntry } from '@/components/molecules/side-nav';
import { useNavigationCounts } from '@/components/organisms/notifications-provider';
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
 * Waiting for me carries how many Asks still wait on the person, Received how much is new in it,
 * and Home how much has newly been shared with them, which only choosing Shared with me there
 * clears. All are read on the bell's poll but not from the bell, so reading a line there changes
 * none of them.
 */
export function SidebarNav({ showsDashboard }: SidebarNavProps) {
  const pathname = usePathname();
  const counts = useNavigationCounts();
  const items: readonly SideNavEntry[] = [
    {
      href: ROUTES.home,
      label: 'Home',
      Icon: HouseIcon,
      count: counts.shared,
      countSaid: SHARED_COUNT_SAID,
    },
    { href: ROUTES.kudos, label: 'Kudos board', Icon: HandHeartIcon },
    {
      href: ROUTES.waiting,
      label: 'Waiting for me',
      Icon: ClockIcon,
      count: counts.waiting,
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
      count: counts.received,
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
