import type { FeedCardProps } from './feed-card-frame';
import { OfferedFeedbackCard } from './offered-feedback-card';
import { RequestedFeedbackCard } from './requested-feedback-card';

/** The card for one piece on Home, chosen by how it came about. */
export function FeedCard(props: FeedCardProps) {
  return props.item.origin === 'REQUESTED' ? (
    <RequestedFeedbackCard {...props} />
  ) : (
    <OfferedFeedbackCard {...props} />
  );
}
