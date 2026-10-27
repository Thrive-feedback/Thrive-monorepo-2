import { SparklesIcon } from 'lucide-react';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { KudosItem } from '@/lib/feedback/kudos-item.type';
import { FeedbackText } from './feedback-text';
import { PersonName } from './person-name';
import { PersonNameList } from './person-name-list';

export type KudosCardProps = {
  item: KudosItem;
};

/** What a card calls somebody who has not introduced themselves yet. */
const GIVER_WITH_NO_NAME = 'A teammate';
const RECIPIENT_WITH_NO_NAME = 'a teammate';

/**
 * One Kudos on a feed: who gave it to whom — one person or many — marked as Kudos, the day, and
 * the message. A spark stands where a Feedback card shows the Giver's initials, so a Kudos reads
 * as one at a glance. No Reactions yet: they are Feedback's (#92).
 */
export function KudosCard({ item }: KudosCardProps) {
  return (
    <article className="flex flex-col gap-3 py-5">
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action-primary-surface text-action-primary"
        >
          <SparklesIcon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <Text as="p" variant="subtitle-4" className="break-words">
            <PersonName
              name={item.giver.name ?? GIVER_WITH_NO_NAME}
              inactive={item.giver.inactive}
            />
            <span className="text-fg-secondary"> to </span>
            <PersonNameList
              people={item.recipients}
              unnamed={RECIPIENT_WITH_NO_NAME}
            />
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            <span className="text-action-primary">Kudos</span> ·{' '}
            <time dateTime={item.givenAt}>{calendarDay(item.givenAt)}</time>
          </Text>
        </div>
      </header>
      <Text as="p" variant="body-1" className="whitespace-pre-line break-words">
        <FeedbackText text={item.message} tags={item.messageTags} />
      </Text>
    </article>
  );
}
