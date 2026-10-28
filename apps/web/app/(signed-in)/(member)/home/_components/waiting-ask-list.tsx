import { readMyAsks } from '@/app/(signed-in)/(member)/home/_lib/my-asks.service';
import { WaitingAskListView } from '@/components/organisms/waiting-ask-list-view';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { requireYou } from '@/lib/session/session.service';

export type WaitingAskListProps = {
  membership: CurrentMembership;
  /** The heading's level, which depends on the page around it. */
  headingAs?: 'h2' | 'h3';
};

/** The Asks waiting on the person, each opening in a dialog over Home, named in the address. */
export async function WaitingAskList({
  membership,
  headingAs,
}: WaitingAskListProps) {
  const [asks, you] = await Promise.all([readMyAsks(membership), requireYou()]);
  return (
    <WaitingAskListView
      asks={asks}
      you={you}
      askTarget={(askId) => ({ href: ROUTES.homeAsk(askId) })}
      headingAs={headingAs}
    />
  );
}
