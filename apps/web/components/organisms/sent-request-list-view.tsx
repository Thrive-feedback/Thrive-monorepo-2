import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { TargetLink } from '@/components/molecules/target-link';
import { calendarDay } from '@/lib/calendar-day.util';
import {
  ASK_STATUS_COLOURS,
  ASK_STATUS_NAMES,
} from '@/lib/feedback/ask-status.constant';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { PersonName } from './person-name';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type SentRequestListViewProps = {
  requests: readonly SentRequest[];
  /** Where a request's Topic leads. Without one, the Topic is plain text. */
  requestTarget?: (requestId: string) => NavTarget;
};

/**
 * Every Feedback Request the person sent, newest first: the Topic, the day it went out, and one
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
    <ul className="flex flex-col gap-4">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-col gap-1 rounded-page bg-surface-raised p-4"
        >
          <Text as="h2" variant="subtitle-4" className="break-words">
            {requestTarget ? (
              <TargetLink target={requestTarget(request.id)}>
                {request.topic}
              </TargetLink>
            ) : (
              request.topic
            )}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            Sent{' '}
            <time dateTime={request.sentAt}>{calendarDay(request.sentAt)}</time>
          </Text>
          <ul className="flex flex-col gap-1">
            {request.asks.map((ask) => (
              <li key={ask.askId}>
                <Text as="span" variant="body-2" className="break-all">
                  <PersonName
                    name={ask.giverName ?? '—'}
                    inactive={ask.giverInactive}
                  />{' '}
                  :{' '}
                  <span className={ASK_STATUS_COLOURS[ask.status]}>
                    {ASK_STATUS_NAMES[ask.status]}
                  </span>
                </Text>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** A `SentRequestListView` still loading: a few rows of Topic, the day sent, and one Member asked. */
export function SentRequestListViewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {PLACEHOLDERS.map((placeholder) => (
        <div
          key={placeholder}
          className="flex flex-col gap-1 rounded-page bg-surface-raised p-4"
        >
          <Skeleton className="w-1/2 text-subtitle-4" />
          <Skeleton className="w-1/4 text-body-3" />
          <Skeleton className="w-1/3" />
        </div>
      ))}
    </div>
  );
}
