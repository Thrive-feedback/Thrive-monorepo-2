import { Text } from '@/components/atoms/text';
import { PeopleStack } from '@/components/molecules/people-stack';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { calendarDay } from '@/lib/calendar-day.util';
import type { ReceivedFeedback } from '@/lib/feedback/received-feedback.type';
import { ActivityRow, ActivityRowSkeleton } from './activity-row';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';
import { PersonNameList } from './person-name-list';

/** The reader, named first among everyone it was written to. */
const YOU = { name: 'you', inactive: false } as const;

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type ReceivedFeedbackListViewProps = {
  items: readonly ReceivedFeedback[];
};

/**
 * Everything people have written to this person, newest first: who wrote it, who else it was
 * for — "to you, Krit and Ann", with the others' faces closing the row — when, whether it was
 * given without being asked, and the Feedback message in full. The message is the row's main
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
        <li key={feedback.id}>
          <ActivityRow
            lead={
              <PhotoAvatar
                name={feedback.giverName ?? ''}
                photoUrl={feedback.giverPhotoUrl}
                size="md"
              />
            }
            title={
              <>
                <PersonName
                  name={feedback.giverName ?? 'A teammate'}
                  inactive={feedback.giverInactive}
                />
                <span className="text-fg-secondary"> to </span>
                <PersonNameList
                  people={[YOU, ...feedback.otherReceivers]}
                  unnamed="a teammate"
                />
              </>
            }
            aside={
              feedback.otherReceivers.length > 0 && (
                <PeopleStack people={feedback.otherReceivers} />
              )
            }
            meta={
              <>
                {feedback.offered ? 'Offered' : 'Requested'} ·{' '}
                <time dateTime={feedback.writtenAt}>
                  {calendarDay(feedback.writtenAt)}
                </time>
              </>
            }
            message={
              <FeedbackText
                text={feedback.message}
                tags={feedback.messageTags}
              />
            }
          />
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
        <ActivityRowSkeleton key={placeholder} />
      ))}
    </div>
  );
}
