import type { FeedItem } from '@/app/(signed-in)/(member)/home/_lib/feed-item.type';
import { Text } from '@/components/atoms/text';
import { FeedbackCard } from './feedback-card';

export type FeedbackFeedProps = {
  items: readonly FeedItem[];
  /** What to say when there is nothing to show. */
  emptyMessage: string;
};

/**
 * A list of Feedback cards, newest first. The items are preview data for now, and the feed says
 * so, so nobody mistakes them for their Workspace's real Feedback.
 */
export function FeedbackFeed({ items, emptyMessage }: FeedbackFeedProps) {
  return (
    <div className="flex flex-col gap-4">
      <Text
        as="p"
        variant="caption"
        tone="info"
        className="rounded-element bg-status-info-surface px-3 py-2"
      >
        Preview data. This feed isn&apos;t connected yet, so these are examples.
      </Text>
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
