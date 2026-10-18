import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { TargetLink } from '@/components/molecules/target-link';
import { calendarDay } from '@/lib/calendar-day.util';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { PersonName } from './person-name';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

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

/** A `WaitingAskListView` still loading: a few rows of Topic, who asked, and when. */
export function WaitingAskListViewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {PLACEHOLDERS.map((placeholder) => (
        <div
          key={placeholder}
          className="flex flex-col gap-1 rounded-page bg-surface-raised p-4"
        >
          <Skeleton className="w-1/2 text-subtitle-4" />
          <Skeleton className="w-1/3" />
          <Skeleton className="w-1/4 text-body-3" />
        </div>
      ))}
    </div>
  );
}
