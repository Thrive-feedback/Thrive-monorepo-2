import { Badge } from '@/components/atoms/badge';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { TargetLink } from '@/components/molecules/target-link';
import { calendarDay } from '@/lib/calendar-day.util';
import {
  ASK_STATUS_NAMES,
  ASK_STATUS_TONES,
} from '@/lib/feedback/ask-status.constant';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type SentRequestListViewProps = {
  requests: readonly SentRequest[];
  /** Where a Request message leads. Without one, it is plain text. */
  requestTarget?: (requestId: string) => NavTarget;
};

/**
 * Every Feedback Request the person sent, newest first: the Request message, the day it went out, and one
 * line per Member asked with where their Ask stands.
 */
export function SentRequestListView({
  requests,
  requestTarget,
}: SentRequestListViewProps) {
  if (requests.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        You haven&apos;t asked anyone for feedback yet. Ask a teammate with the
        form above.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border-muted">
      {requests.map((request) => (
        <li key={request.id} className="flex flex-col gap-1 py-4">
          <Text as="h2" variant="subtitle-2" className="break-words">
            {requestTarget ? (
              <TargetLink target={requestTarget(request.id)}>
                <FeedbackText
                  text={request.message}
                  tags={request.messageTags}
                />
              </TargetLink>
            ) : (
              <FeedbackText text={request.message} tags={request.messageTags} />
            )}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            Sent{' '}
            <time dateTime={request.sentAt}>{calendarDay(request.sentAt)}</time>
          </Text>
          <ul className="flex flex-col gap-1">
            {request.asks.map((ask) => (
              <li key={ask.askId} className="flex items-center gap-2">
                <Text as="span" variant="body-2" className="break-all">
                  <PersonName
                    name={ask.giverName ?? '—'}
                    inactive={ask.giverInactive}
                  />
                </Text>
                <Badge tone={ASK_STATUS_TONES[ask.status]}>
                  {ASK_STATUS_NAMES[ask.status]}
                </Badge>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** A `SentRequestListView` still loading: a few rows of Request message, the day sent, and one Member asked. */
export function SentRequestListViewSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border-muted">
      {PLACEHOLDERS.map((placeholder) => (
        <div key={placeholder} className="flex flex-col gap-1 py-4">
          <Skeleton className="w-1/2 text-subtitle-2" />
          <Skeleton className="w-1/4 text-body-3" />
          <Skeleton className="w-1/3" />
        </div>
      ))}
    </div>
  );
}
