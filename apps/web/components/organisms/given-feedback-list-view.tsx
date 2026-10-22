import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { GivenFeedback } from '@/lib/feedback/given-feedback.type';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type GivenFeedbackListViewProps = {
  items: readonly GivenFeedback[];
};

/**
 * Everything this person has written to others, newest first: what it is about, whom it was for,
 * when, whether it was given without being asked, and what they wrote in full — shown whole, with
 * its line breaks, as Feedback for me shows what was written to them.
 */
export function GivenFeedbackListView({ items }: GivenFeedbackListViewProps) {
  if (items.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        You haven’t given anyone feedback yet. Give a teammate some with the
        form above.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border-muted">
      {items.map((feedback) => (
        <li key={feedback.id} className="flex flex-col gap-1 py-4">
          <Text as="h2" variant="subtitle-2" className="break-words">
            <FeedbackText text={feedback.topic} tags={feedback.topicTags} />
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            To{' '}
            <PersonName
              name={feedback.receiverName ?? 'a teammate'}
              inactive={feedback.receiverInactive}
            />{' '}
            ·{' '}
            <time dateTime={feedback.writtenAt}>
              {calendarDay(feedback.writtenAt)}
            </time>
            {feedback.offered && ' · Given without a request'}
          </Text>
          <Text
            as="p"
            variant="body-2"
            className="whitespace-pre-wrap break-words"
          >
            <FeedbackText text={feedback.body} tags={feedback.bodyTags} />
          </Text>
        </li>
      ))}
    </ul>
  );
}

/** A `GivenFeedbackListView` still loading: a few rows of Topic, to whom and when, and the body. */
export function GivenFeedbackListViewSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border-muted">
      {PLACEHOLDERS.map((placeholder) => (
        <div key={placeholder} className="flex flex-col gap-1 py-4">
          <Skeleton className="w-1/2 text-subtitle-2" />
          <Skeleton className="w-1/3 text-body-3" />
          <div className="flex flex-col">
            <Skeleton />
            <Skeleton className="w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
