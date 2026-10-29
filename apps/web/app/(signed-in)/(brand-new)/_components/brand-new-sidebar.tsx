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
import { readTeammates } from '@/lib/feedback/teammates.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { ComposeMenu } from './compose-menu';

/**
 * The new Home's sidebar: "+" to write something, then where to go. Only Home is built; the rest
 * are drawn where they will be and lead nowhere yet. Waiting for me already counts the Asks
 * waiting for the person, because that number is what makes them open it. Who a postcard can be
 * for, and who signs it, are read here, so "+" can hand them to the postcard.
 */
export async function BrandNewSidebar() {
  const session = await requireMember();
  const { membership, email } = session;
  const [waiting, teammates] = await Promise.all([
    readMyAsks(membership),
    readTeammates(membership, email),
  ]);

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
      <ComposeMenu
        teammates={teammates}
        writer={{
          name: session.profile.displayName,
          photoUrl: session.photoUrl,
        }}
      />
      <SideNav label="Main" items={items} currentHref={ROUTES.brandNewHome} />
    </div>
  );
}
