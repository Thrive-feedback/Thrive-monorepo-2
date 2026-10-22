import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { ReceivedFeedback } from '@/lib/feedback/received-feedback.type';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type ReceivedFeedbackListViewProps = {
  items: readonly ReceivedFeedback[];
};

/**
 * Everything people have written to this person, newest first: who wrote it, when, whether it
 * was given without being asked, and the Feedback message in full. The message is the row's main
 * text: there is no headline above it (`ADR-0039` in the brain).
 *
 * The message is shown whole rather than trimmed to a preview — it is at most a few paragraphs,
 * and a Receiver reading their own feedback has no second screen to open for the rest. Its
 * line breaks are the writer's, so they are kept.
 */
export function ReceivedFeedbackListView({
  items,
}: ReceivedFeedbackListViewProps) {
  if (items.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        No one has written you feedback yet. Ask a teammate with the form above.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border-muted">
      {items.map((feedback) => (
        <li key={feedback.id} className="flex flex-col gap-1 py-4">
          <Text as="p" variant="body-3" tone="muted">
            From{' '}
            <PersonName
              name={feedback.giverName ?? 'a teammate'}
              inactive={feedback.giverInactive}
            />{' '}
            ·{' '}
            <time dateTime={feedback.writtenAt}>
              {calendarDay(feedback.writtenAt)}
            </time>
            {feedback.offered && ' · Given without a request'}
          </Text>
          <Text
            as="p"
            variant="body-1"
            className="whitespace-pre-wrap break-words"
          >
            <FeedbackText text={feedback.message} tags={feedback.messageTags} />
          </Text>
        </li>
      ))}
    </ul>
  );
}

/** A `ReceivedFeedbackListView` still loading: a few rows of from whom and when, and the message. */
export function ReceivedFeedbackListViewSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border-muted">
      {PLACEHOLDERS.map((placeholder) => (
        <div key={placeholder} className="flex flex-col gap-1 py-4">
          <Skeleton className="w-1/3 text-body-3" />
          <div className="flex flex-col">
            <Skeleton className="text-body-1" />
            <Skeleton className="w-4/5 text-body-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
