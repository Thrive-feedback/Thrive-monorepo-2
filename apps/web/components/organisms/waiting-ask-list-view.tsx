import { Text } from '@/components/atoms/text';
import { TargetLink } from '@/components/molecules/target-link';
import { calendarDay } from '@/lib/calendar-day.util';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { PersonName } from './person-name';

export type WaitingAskListViewProps = {
  asks: readonly MyAsk[];
  /** Where an Ask's Topic leads: to the place it is answered. */
  askTarget: (askId: string) => NavTarget;
};

/**
 * Every Ask waiting on the person: who asked, about what, and when. With Notifications at Low
 * priority (`ADR-0006`), this list is the only way a Giver finds out they were asked at all.
 *
 * The Topic is the link rather than a repeated "Answer this", so each row announces itself by
 * what it is about.
 */
export function WaitingAskListView({
  asks,
  askTarget,
}: WaitingAskListViewProps) {
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
            <TargetLink target={askTarget(ask.askId)}>{ask.topic}</TargetLink>
          </Text>
          <Text as="p" variant="body-2">
            Asked by{' '}
            <PersonName
              name={ask.requesterName ?? 'a teammate'}
              inactive={ask.requesterInactive}
            />
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            <time dateTime={ask.askedAt}>{calendarDay(ask.askedAt)}</time>
          </Text>
        </li>
      ))}
    </ul>
  );
}
