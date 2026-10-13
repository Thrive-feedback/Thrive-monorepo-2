import {
  ASK_STATUS_COLOURS,
  ASK_STATUS_NAMES,
} from '@/app/(signed-in)/(side-nav)/feedback/_lib/ask-status.constant';
import { readSentRequests } from '@/app/(signed-in)/(side-nav)/feedback/sent/_lib/sent-requests.service';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type SentRequestListProps = {
  membership: CurrentMembership;
};

/**
 * Every Feedback Request the person sent, newest first: the Topic, the day it went out, and
 * one line per Member asked with where their Ask stands. It reads its own data, so the page
 * renders around it while the read is in flight.
 */
export async function SentRequestList({ membership }: SentRequestListProps) {
  const requests = await readSentRequests(membership);
  if (requests.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Text variant="body-2" tone="muted">
          You haven&apos;t asked anyone for feedback yet.
        </Text>
        <Link href={ROUTES.home}>Ask a teammate for feedback</Link>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-col gap-1 rounded-page bg-surface-overlay p-4"
        >
          <Text as="h2" variant="subtitle-4" className="break-words">
            {request.topic}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            Sent{' '}
            <time dateTime={request.sentAt}>{calendarDay(request.sentAt)}</time>
          </Text>
          <ul className="flex flex-col gap-1">
            {request.asks.map((ask) => (
              <li key={ask.askId}>
                <Text as="span" variant="body-2" className="break-all">
                  {ask.giverName ?? '—'} :{' '}
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
