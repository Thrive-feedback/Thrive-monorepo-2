import { Text } from '@/components/atoms/text';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { FeedbackCard } from './feedback-card';

export type FeedbackFeedProps = {
  items: readonly FeedItem[];
  /** What to say when there is nothing to show. */
  emptyMessage: string;
  /**
   * The items are made up because the API cannot serve them yet. The feed then says so, so
   * nobody mistakes them for their Workspace's real Feedback.
   */
  isPreviewData?: boolean;
};

/** A list of Feedback cards, newest first. */
export function FeedbackFeed({
  items,
  emptyMessage,
  isPreviewData = false,
}: FeedbackFeedProps) {
  return (
    <div className="flex flex-col gap-4">
      {isPreviewData && (
        <Text
          as="p"
          variant="caption"
          tone="info"
          className="rounded-element bg-status-info-surface px-3 py-2"
        >
          Preview data. This feed isn&apos;t connected yet, so these are
          examples.
        </Text>
      )}
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
