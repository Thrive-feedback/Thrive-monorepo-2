import {
  ClockIcon,
  HandHeartIcon,
  HouseIcon,
  InboxIcon,
  MessageCircleQuestionMarkIcon,
  SendIcon,
  UsersIcon,
} from 'lucide-react';
import { SideNav, type SideNavEntry } from '@/components/molecules/side-nav';
import { readMyAsks } from '@/lib/feedback/my-asks.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { ComposeMenu } from './compose-menu';

/**
 * The new Home's sidebar: "+" to write something, then where to go. Only Home is built; the rest
 * are drawn where they will be and lead nowhere yet. Waiting for me already counts the Asks
 * waiting for the person, because that number is what makes them open it.
 */
export async function BrandNewSidebar() {
  const { membership } = await requireMember();
  const waiting = await readMyAsks(membership);

  const items: readonly SideNavEntry[] = [
    { href: ROUTES.brandNewHome, label: 'Home', Icon: HouseIcon },
    { label: 'Kudos board', Icon: HandHeartIcon },
    { label: 'Waiting for me', Icon: ClockIcon, count: waiting.length },
    { label: 'Members', Icon: UsersIcon },
    { heading: 'My Feedback' },
    { label: 'Received', Icon: InboxIcon },
    { label: 'Given', Icon: SendIcon },
    { label: 'My requests', Icon: MessageCircleQuestionMarkIcon },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ComposeMenu />
      <SideNav label="Main" items={items} currentHref={ROUTES.brandNewHome} />
    </div>
  );
}
