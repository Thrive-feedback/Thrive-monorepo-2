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
import { SideNav, type SideNavEntry } from '@/components/molecules/side-nav';
import { ROUTES } from '@/lib/routes.constant';

export type SidebarNavProps = {
  /** How many Asks are waiting for the person, because that number is what makes them open it. */
  waitingCount: number;
};

/**
 * Where to go from Home; items with no address are drawn where they will be and lead nowhere
 * yet. It reads the path itself because the layout around it does not run again when the client
 * navigates between the pages under it.
 */
export function SidebarNav({ waitingCount }: SidebarNavProps) {
  const pathname = usePathname();
  const items: readonly SideNavEntry[] = [
    { href: ROUTES.home, label: 'Home', Icon: HouseIcon },
    { href: ROUTES.kudos, label: 'Kudos board', Icon: HandHeartIcon },
    {
      href: ROUTES.waiting,
      label: 'Waiting for me',
      Icon: ClockIcon,
      count: waitingCount,
    },
    { label: 'Teammates', Icon: UsersIcon },
    { heading: 'My Feedback' },
    { href: ROUTES.dashboard, label: 'Your dashboard', Icon: SparklesIcon },
    { href: ROUTES.received, label: 'Received', Icon: InboxIcon },
    { href: ROUTES.given, label: 'Given', Icon: SendIcon },
  ];

  return <SideNav label="Main" items={items} currentHref={pathname} />;
}
