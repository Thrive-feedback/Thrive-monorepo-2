import { MessageCircleQuestionMarkIcon } from 'lucide-react';
import { Fragment } from 'react';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import {
  ASK_STATUS_NAMES,
  ASK_STATUS_TONES,
} from '@/lib/feedback/ask-status.constant';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { ActivityRow, ActivityRowSkeleton } from './activity-row';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type SentRequestListViewProps = {
  requests: readonly SentRequest[];
  /** Where a Request message leads. Without one, it is plain text. */
  requestTarget?: (requestId: string) => NavTarget;
};

/** Between the names asked: commas, and "and" before the last. */
function separatorBefore(index: number, count: number) {
  if (index === 0) return '';
  return index === count - 1 ? ' and ' : ', ';
}

/**
 * Every Feedback Request the person sent, newest first: who they asked, each with where their
 * Ask stands beside their name, the day it went out, and the Request message. The person's own
 * rows carry a question mark where other rows carry a face, since the person asking is always
 * them.
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
        <li key={request.id}>
          <ActivityRow
            lead={
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action-neutral-surface text-fg-secondary"
              >
                <MessageCircleQuestionMarkIcon className="size-4" />
              </span>
            }
            title={
              <>
                <span className="text-fg-secondary">You asked </span>
                {request.asks.map((ask, index) => (
                  <Fragment key={ask.askId}>
                    <span className="text-fg-secondary">
                      {separatorBefore(index, request.asks.length)}
                    </span>
                    <PersonName
                      name={ask.giverName ?? 'a teammate'}
                      inactive={ask.giverInactive}
                    />{' '}
                    <Badge
                      tone={ASK_STATUS_TONES[ask.status]}
                      className="align-middle"
                    >
                      {ASK_STATUS_NAMES[ask.status]}
                    </Badge>
                  </Fragment>
                ))}
              </>
            }
            meta={
              <>
                Sent{' '}
                <time dateTime={request.sentAt}>
                  {calendarDay(request.sentAt)}
                </time>
              </>
            }
            message={
              <FeedbackText text={request.message} tags={request.messageTags} />
            }
            target={requestTarget?.(request.id)}
          />
        </li>
      ))}
    </ul>
  );
}

/** A `SentRequestListView` still loading, row for row. */
export function SentRequestListViewSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border-muted">
      {PLACEHOLDERS.map((placeholder) => (
        <ActivityRowSkeleton key={placeholder} />
      ))}
    </div>
  );
}
