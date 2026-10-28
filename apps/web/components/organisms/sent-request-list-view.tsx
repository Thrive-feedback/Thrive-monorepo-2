import { Text } from '@/components/atoms/text';
import type { FeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import { SentRequestCard, SentRequestCardSkeleton } from './sent-request-card';

/** Enough cards to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type SentRequestListViewProps = {
  requests: readonly SentRequest[];
  /** The person reading, who sent them: named "You" on every card. */
  you: FeedbackPerson;
};

/**
 * Every Feedback Request the person sent, newest first, each a `SentRequestCard`: who they asked
 * and where each Ask stands, the Request message, and the answers that came back.
 */
export function SentRequestListView({
  requests,
  you,
}: SentRequestListViewProps) {
  if (requests.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        You haven&apos;t asked anyone for feedback yet. Ask a teammate with the
        form above.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border-muted">
      {requests.map((request) => (
        <li key={request.id}>
          <SentRequestCard request={request} you={you} />
        </li>
      ))}
    </ul>
  );
}

/** A `SentRequestListView` still loading, card for card. */
export function SentRequestListViewSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border-muted">
      {PLACEHOLDERS.map((placeholder) => (
        <SentRequestCardSkeleton key={placeholder} />
      ))}
    </div>
  );
}
