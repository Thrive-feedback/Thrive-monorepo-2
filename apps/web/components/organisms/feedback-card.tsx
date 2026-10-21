import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import { type FeedItem, REACTIONS } from '@/lib/feedback/feed-item.type';
import { initials } from '@/lib/initials.util';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';
import { ReactionBar } from './reaction-bar';

const ORIGIN_NAMES: Readonly<Record<FeedItem['origin'], string>> = {
  REQUESTED: 'Requested',
  OFFERED: 'Offered',
};

export type FeedbackCardProps = {
  item: FeedItem;
};

/** What a card calls somebody who has not introduced themselves yet. */
const GIVER_WITH_NO_NAME = 'A teammate';
const RECEIVER_WITH_NO_NAME = 'a teammate';

/**
 * One piece of Feedback on a feed: who gave it to whom — never anonymous (`ADR-0022`), though a
 * Member who has not introduced themselves has no name to show — whether it was asked for, the
 * Topic, the answer, the day, and the Reactions.
 */
export function FeedbackCard({ item }: FeedbackCardProps) {
  return (
    <article className="flex flex-col gap-3 py-5">
      <header className="flex items-center gap-3">
        <Avatar size="md" aria-hidden="true">
          <AvatarFallback>{initials(item.giverName ?? '')}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <Text as="p" variant="subtitle-4" className="break-words">
            <PersonName
              name={item.giverName ?? GIVER_WITH_NO_NAME}
              inactive={item.giverInactive}
            />
            <span className="text-fg-secondary"> to </span>
            <PersonName
              name={item.receiverName ?? RECEIVER_WITH_NO_NAME}
              inactive={item.receiverInactive}
            />
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            {ORIGIN_NAMES[item.origin]} ·{' '}
            <time dateTime={item.givenAt}>{calendarDay(item.givenAt)}</time>
          </Text>
        </div>
      </header>
      <Text as="h3" variant="subtitle-2" className="break-words">
        <FeedbackText text={item.topic} tags={item.topicTags} />
      </Text>
      <Text as="p" variant="body-2" className="whitespace-pre-line break-words">
        <FeedbackText text={item.body} tags={item.bodyTags} />
      </Text>
      <ReactionBar reactions={item.reactions} />
    </article>
  );
}

/** A `FeedbackCard` still loading, line for line: who to whom, origin and day, Topic, body, Reactions. */
export function FeedbackCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="size-8" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Skeleton className="w-1/2 text-subtitle-4" />
          <Skeleton className="w-1/3 text-body-3" />
        </div>
      </div>
      <Skeleton className="w-2/3 text-subtitle-2" />
      <div className="flex flex-col">
        <Skeleton />
        <Skeleton className="w-4/5" />
      </div>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ emoji }) => (
          <Skeleton key={emoji} shape="circle" className="h-7 w-12" />
        ))}
      </div>
    </div>
  );
}
