import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { ReceivedFeedback } from '@/lib/feedback/received-feedback.type';
import { PersonName } from './person-name';

export type ReceivedFeedbackListViewProps = {
  items: readonly ReceivedFeedback[];
};

/**
 * Everything people have written to this person, newest first: what it is about, who wrote it,
 * when, whether it was given without being asked, and what they wrote in full.
 *
 * The body is shown whole rather than trimmed to a preview — it is at most a few paragraphs,
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
    <ul className="flex flex-col gap-4">
      {items.map((feedback) => (
        <li
          key={feedback.id}
          className="flex flex-col gap-1 rounded-page bg-surface-raised p-4"
        >
          <Text as="h2" variant="subtitle-4" className="break-words">
            {feedback.topic}
          </Text>
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
            variant="body-2"
            className="whitespace-pre-wrap break-words"
          >
            {feedback.body}
          </Text>
        </li>
      ))}
    </ul>
  );
}
