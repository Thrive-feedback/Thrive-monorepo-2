import { WaitingAskListView } from '@/components/organisms/waiting-ask-list-view';
import { readMyAsks } from '@/lib/feedback/my-asks.service';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

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
  const asks = await readMyAsks(membership);
  return (
    <WaitingAskListView
      asks={asks}
      askTarget={(askId) => ({ href: ROUTES.homeAsk(askId) })}
      headingAs={headingAs}
    />
  );
}
