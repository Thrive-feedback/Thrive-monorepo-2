import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { initials } from '@/lib/initials.util';
import { ReactionBar } from './reaction-bar';

const ORIGIN_NAMES: Readonly<Record<FeedItem['origin'], string>> = {
  REQUESTED: 'Requested',
  OFFERED: 'Offered',
};

export type FeedbackCardProps = {
  item: FeedItem;
};

/**
 * One piece of Feedback on a feed: who gave it to whom — always named (`ADR-0022`) — whether it
 * was asked for, the Topic, the answer, the day, and the Reactions.
 */
export function FeedbackCard({ item }: FeedbackCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-page bg-surface-raised p-4">
      <header className="flex items-center gap-3">
        <Avatar size="md" aria-hidden="true">
          <AvatarFallback>{initials(item.giverName)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <Text as="p" variant="subtitle-4" className="break-words">
            {item.giverName}
            <span className="text-fg-secondary"> to </span>
            {item.receiverName}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            {ORIGIN_NAMES[item.origin]} ·{' '}
            <time dateTime={item.givenAt}>{calendarDay(item.givenAt)}</time>
          </Text>
        </div>
      </header>
      <Text as="h3" variant="subtitle-3" className="break-words">
        {item.topic}
      </Text>
      <Text as="p" variant="body-2" className="whitespace-pre-line break-words">
        {item.body}
      </Text>
      <ReactionBar reactions={item.reactions} />
    </article>
  );
}
