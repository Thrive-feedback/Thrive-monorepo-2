import { Text } from '@/components/atoms/text';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import type { KudosItem } from '@/lib/feedback/kudos-item.type';
import { FeedbackCard } from './feedback-card';
import { KudosCard } from './kudos-card';

export type FeedbackFeedProps = {
  items: readonly FeedItem[];
  /** Kudos to show among the Feedback, by date. Only the Workspace feed has any. */
  kudos?: readonly KudosItem[];
  /** What to say when there is nothing to show. */
  emptyMessage: string;
};

type Entry =
  | { readonly kind: 'feedback'; readonly item: FeedItem }
  | { readonly kind: 'kudos'; readonly item: KudosItem };

/**
 * A list of Feedback, and any Kudos among it, newest first, one row each with a hairline between.
 * Both lists come newest first as ISO dates, which sort as text; a tie keeps Feedback first.
 */
export function FeedbackFeed({
  items,
  kudos = [],
  emptyMessage,
}: FeedbackFeedProps) {
  const entries: Entry[] = [
    ...items.map((item) => ({ kind: 'feedback' as const, item })),
    ...kudos.map((item) => ({ kind: 'kudos' as const, item })),
  ].sort((a, b) => b.item.givenAt.localeCompare(a.item.givenAt));

  return (
    <div className="flex flex-col gap-4">
      {entries.length === 0 ? (
        <Text variant="body-2" tone="muted">
          {emptyMessage}
        </Text>
      ) : (
        <ul className="flex flex-col divide-y divide-border-muted">
          {entries.map((entry) => (
            <li key={`${entry.kind}-${entry.item.id}`}>
              {entry.kind === 'kudos' ? (
                <KudosCard item={entry.item} />
              ) : (
                <FeedbackCard item={entry.item} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
