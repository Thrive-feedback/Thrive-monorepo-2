import { readSentRequests } from '@/app/(signed-in)/(member)/home/_lib/sent-requests.service';
import { SentRequestListView } from '@/components/organisms/sent-request-list-view';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type SentRequestListProps = {
  membership: CurrentMembership;
};

/**
 * The person's sent Feedback Requests, read here so the page renders around the read while it is
 * in flight. Each Request message opens its request in a dialog over My requests, named in the address.
 */
export async function SentRequestList({ membership }: SentRequestListProps) {
  const requests = await readSentRequests(membership);
  return (
    <SentRequestListView
      requests={requests}
      requestTarget={(requestId) => ({ href: ROUTES.homeRequest(requestId) })}
    />
  );
}
