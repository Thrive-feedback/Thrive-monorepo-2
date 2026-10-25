import { CircleCheckIcon } from 'lucide-react';
import { useId } from 'react';
import { Badge } from '@/components/atoms/badge';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { initials } from '@/lib/initials.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import {
  ActivityAvatar,
  ActivityRow,
  ActivityRowSkeleton,
} from './activity-row';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second'] as const;

export type WaitingAskListViewProps = {
  asks: readonly MyAsk[];
  /** Where an Ask's Request message leads: to the place it is answered. */
  askTarget: (askId: string) => NavTarget;
  /** The heading's level, which depends on the page around it. */
  headingAs?: 'h2' | 'h3';
};

/**
 * Every Ask waiting on the person — who asked, about what, and when — under a heading that says
 * how many. It sits above the history tabs on Home, always in view, because it is the one list
 * where somebody is waiting on the person reading it. Each row opens the Ask to answer.
 */
export function WaitingAskListView({
  asks,
  askTarget,
  headingAs = 'h2',
}: WaitingAskListViewProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Text as={headingAs} id={headingId} variant="subtitle-3">
          Waiting for me
        </Text>
        {asks.length > 0 && (
          <Badge tone="brand" size="md" className="tabular-nums">
            {asks.length}
          </Badge>
        )}
      </div>
      {asks.length === 0 ? (
        <Text
          as="p"
          variant="body-2"
          tone="muted"
          className="flex items-center gap-2 py-2"
        >
          <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
          Nothing is waiting for you.
        </Text>
      ) : (
        <ul className="flex flex-col divide-y divide-border-muted">
          {asks.map((ask) => (
            <li key={ask.askId}>
              <ActivityRow
                lead={
                  <ActivityAvatar
                    initials={initials(ask.requesterName ?? '')}
                  />
                }
                title={
                  <>
                    <PersonName
                      name={ask.requesterName ?? 'A teammate'}
                      inactive={ask.requesterInactive}
                    />
                    <span className="text-fg-secondary"> asked you</span>
                  </>
                }
                meta={
                  <time dateTime={ask.askedAt}>{calendarDay(ask.askedAt)}</time>
                }
                message={
                  <FeedbackText text={ask.message} tags={ask.messageTags} />
                }
                target={askTarget(ask.askId)}
                actionLabel="Answer"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A `WaitingAskListView` still loading: its heading, and a couple of rows. */
export function WaitingAskListViewSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="w-1/3 text-subtitle-3" />
      <div className="flex flex-col divide-y divide-border-muted">
        {PLACEHOLDERS.map((placeholder) => (
          <ActivityRowSkeleton key={placeholder} />
        ))}
      </div>
    </div>
  );
}
