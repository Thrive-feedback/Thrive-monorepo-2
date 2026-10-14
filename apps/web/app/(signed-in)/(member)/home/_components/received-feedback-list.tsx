import { readReceivedFeedback } from '@/app/(signed-in)/(member)/home/_lib/received-feedback.service';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type ReceivedFeedbackListProps = {
  membership: CurrentMembership;
};

/**
 * Everything people have written to this person, newest first: the Topic they were asked
 * about, who wrote it, when, and what they wrote in full.
 *
 * The body is shown whole rather than trimmed to a preview — it is at most a few paragraphs,
 * and a Receiver reading their own feedback has no second screen to open for the rest. Its
 * line breaks are the writer's, so they are kept.
 */
export async function ReceivedFeedbackList({
  membership,
}: ReceivedFeedbackListProps) {
  const received = await readReceivedFeedback(membership);
  if (received.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        No one has written you feedback yet. Ask a teammate with the form above.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {received.map((feedback) => (
        <li
          key={feedback.id}
          className="flex flex-col gap-1 rounded-page bg-surface-raised p-4"
        >
          <Text as="h2" variant="subtitle-4" className="break-words">
            {feedback.topic}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            From {feedback.giverName ?? 'a teammate'} ·{' '}
            <time dateTime={feedback.writtenAt}>
              {calendarDay(feedback.writtenAt)}
            </time>
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
