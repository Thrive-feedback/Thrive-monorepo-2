'use client';

import {
  ClockIcon,
  HandHeartIcon,
  HouseIcon,
  InboxIcon,
  MessageCircleQuestionMarkIcon,
  SendIcon,
  UsersIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SideNav, type SideNavEntry } from '@/components/molecules/side-nav';
import { ROUTES } from '@/lib/routes.constant';

export type BrandNewSideNavProps = {
  /** How many Asks are waiting for the person, because that number is what makes them open it. */
  waitingCount: number;
};

/**
 * Where to go in the new Home; items with no address are drawn where they will be and lead nowhere
 * yet. It reads the path itself because the layout around it does not run again when the client
 * navigates between the pages under it.
 */
export function BrandNewSideNav({ waitingCount }: BrandNewSideNavProps) {
  const pathname = usePathname();
  const items: readonly SideNavEntry[] = [
    { href: ROUTES.brandNewHome, label: 'Home', Icon: HouseIcon },
    { href: ROUTES.brandNewKudos, label: 'Kudos board', Icon: HandHeartIcon },
    {
      href: ROUTES.brandNewWaiting,
      label: 'Waiting for me',
      Icon: ClockIcon,
      count: waitingCount,
    },
    { label: 'Members', Icon: UsersIcon },
    { heading: 'My Feedback' },
    { label: 'Received', Icon: InboxIcon },
    { label: 'Given', Icon: SendIcon },
    { label: 'My requests', Icon: MessageCircleQuestionMarkIcon },
  ];

  return <SideNav label="Main" items={items} currentHref={pathname} />;
}
