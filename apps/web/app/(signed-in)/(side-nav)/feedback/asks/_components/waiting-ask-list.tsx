import { sentDay } from '@/app/(signed-in)/(side-nav)/feedback/_lib/sent-day.util';
import { readMyAsks } from '@/app/(signed-in)/(side-nav)/feedback/asks/_lib/my-asks.service';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type WaitingAskListProps = {
  membership: CurrentMembership;
};

/**
 * Every Ask waiting on the person: who asked, about what, and when. With Notifications at Low
 * priority (`ADR-0006`), this list is the only way a Giver finds out they were asked at all.
 *
 * Nothing opens yet — the screen that writes an answer is #24. Until it exists a row says what
 * is waiting rather than pretending to lead somewhere.
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
          className="flex flex-col gap-1 rounded-page bg-surface-overlay p-4"
        >
          <Text as="h2" variant="subtitle-4" className="break-words">
            {ask.topic}
          </Text>
          <Text as="p" variant="body-2">
            Asked by {ask.requesterName ?? 'a teammate'}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            <time dateTime={ask.askedAt}>{sentDay(ask.askedAt)}</time>
          </Text>
        </li>
      ))}
    </ul>
  );
}
