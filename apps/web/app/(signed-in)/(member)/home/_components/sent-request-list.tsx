import { readSentRequests } from '@/app/(signed-in)/(member)/home/_lib/sent-requests.service';
import { SentRequestListView } from '@/components/organisms/sent-request-list-view';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { requireYou } from '@/lib/session/session.service';

export type SentRequestListProps = {
  membership: CurrentMembership;
};

/**
 * The person's sent Feedback Requests, read here so the page renders around the read while it is
 * in flight. Each Request message opens its request in a dialog over My requests, named in the address.
 */
export async function SentRequestList({ membership }: SentRequestListProps) {
  const [requests, you] = await Promise.all([
    readSentRequests(membership),
    requireYou(),
  ]);
  return <SentRequestListView requests={requests} you={you} />;
}
