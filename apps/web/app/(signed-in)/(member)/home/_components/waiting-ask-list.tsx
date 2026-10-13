import { readMyAsks } from '@/app/(signed-in)/(member)/home/_lib/my-asks.service';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type WaitingAskListProps = {
  membership: CurrentMembership;
};

/**
 * Every Ask waiting on the person: who asked, about what, and when. With Notifications at Low
 * priority (`ADR-0006`), this list is the only way a Giver finds out they were asked at all.
 *
 * The Topic is the link rather than a repeated "Answer this", so each row announces itself by
 * what it is about.
 */
export async function WaitingAskList({ membership }: WaitingAskListProps) {
  const asks = await readMyAsks(membership);
  if (asks.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        Nothing is waiting for you.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {asks.map((ask) => (
        <li
          key={ask.askId}
          className="flex flex-col gap-1 rounded-page bg-surface-raised p-4"
        >
          <Text as="h2" variant="subtitle-4" className="break-words">
            <Link href={ROUTES.feedback.askById(ask.askId)}>{ask.topic}</Link>
          </Text>
          <Text as="p" variant="body-2">
            Asked by {ask.requesterName ?? 'a teammate'}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            <time dateTime={ask.askedAt}>{calendarDay(ask.askedAt)}</time>
          </Text>
        </li>
      ))}
    </ul>
  );
}
