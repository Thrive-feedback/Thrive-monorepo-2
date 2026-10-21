import { Text } from '@/components/atoms/text';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { FeedbackCard, FeedbackCardSkeleton } from './feedback-card';

/** Enough cards to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type FeedbackFeedProps = {
  items: readonly FeedItem[];
  /** What to say when there is nothing to show. */
  emptyMessage: string;
};

/** A list of Feedback, newest first, one row each with a hairline between. */
export function FeedbackFeed({ items, emptyMessage }: FeedbackFeedProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <Text variant="body-2" tone="muted">
          {emptyMessage}
        </Text>
      ) : (
        <ul className="flex flex-col divide-y divide-border-muted">
          {items.map((item) => (
            <li key={item.id}>
              <FeedbackCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A `FeedbackFeed` still loading: a few cards, spaced as the feed spaces them. */
export function FeedbackFeedSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border-muted">
      {PLACEHOLDERS.map((placeholder) => (
        <FeedbackCardSkeleton key={placeholder} />
      ))}
    </div>
  );
}
