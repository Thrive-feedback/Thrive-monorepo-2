import { Text } from '@/components/atoms/text';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { FeedbackCard } from './feedback-card';

export type FeedbackFeedProps = {
  items: readonly FeedItem[];
  /** What to say when there is nothing to show. */
  emptyMessage: string;
};

/** A list of Feedback cards, newest first. */
export function FeedbackFeed({ items, emptyMessage }: FeedbackFeedProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <Text variant="body-2" tone="muted">
          {emptyMessage}
        </Text>
      ) : (
        <ul className="flex flex-col gap-4">
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
