import { readMyAsks } from '@/app/(signed-in)/(member)/home/_lib/my-asks.service';
import { WaitingAskListView } from '@/components/organisms/waiting-ask-list-view';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type WaitingAskListProps = {
  membership: CurrentMembership;
};

/** The Asks waiting on the person, each opening in a dialog over Home, named in the address. */
export async function WaitingAskList({ membership }: WaitingAskListProps) {
  const asks = await readMyAsks(membership);
  return (
    <WaitingAskListView
      asks={asks}
      askTarget={(askId) => ({ href: ROUTES.homeAsk(askId) })}
    />
  );
}
