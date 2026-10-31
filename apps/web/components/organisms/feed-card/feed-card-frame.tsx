import { GlobeIcon, UsersIcon } from 'lucide-react';
import { Badge } from '@/components/atoms/badge';
import { MiniPostcard } from '@/components/atoms/mini-postcard';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { TargetLink } from '@/components/molecules/target-link';
import { calendarDay } from '@/lib/calendar-day.util';
import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { PeopleDialogButton } from '../people-dialog-button';
import { PersonName } from '../person-name';
import {
  feedCardGiver,
  feedCardSentence,
  readerFirst,
} from './feed-card-sentence.util';

const ORIGIN_NAMES: Readonly<Record<HomeFeedItem['origin'], string>> = {
  REQUESTED: 'Requested',
  OFFERED: 'Offered',
};

/** Who can read a card, in the Visibility's own words. Text and icon, never the icon alone. */
const AUDIENCES: Readonly<
  Record<HomeFeedItem['visibility'], { label: string; Icon: typeof GlobeIcon }>
> = {
  EVERYONE: { label: 'Everyone in the Workspace', Icon: GlobeIcon },
  SELECTED_PEOPLE: { label: 'Selected people', Icon: UsersIcon },
};

/** What a card calls somebody who has not introduced themselves yet. */
const RECEIVER_WITH_NO_NAME = 'a teammate';

export type FeedCardProps = {
  item: HomeFeedItem;
  /** Who is reading, so the card can say "You" where it names them. */
  readerAccountId: string;
  /** What pressing the small postcard does. */
  target: NavTarget;
};

export type FeedCardFrameProps = FeedCardProps & {
  /** What was written, under the header. */
  children: React.ReactNode;
};

/**
 * Who a card is for: one person's face and name, the reader as "you", or several people as a small
 * stack, the reader first, which lists them on a press.
 */
function Receivers({
  item,
  readerAccountId,
}: Pick<FeedCardProps, 'item' | 'readerAccountId'>) {
  const [onlyReceiver] = item.receivers;

  if (item.receivers.length === 1 && onlyReceiver) {
    return (
      <AvatarName
        name={onlyReceiver.name ?? ''}
        photoUrl={onlyReceiver.photoUrl}
        size="sm"
      >
        {onlyReceiver.accountId === readerAccountId ? (
          'you'
        ) : (
          <PersonName
            name={onlyReceiver.name ?? RECEIVER_WITH_NO_NAME}
            inactive={onlyReceiver.inactive}
          />
        )}
      </AvatarName>
    );
  }
  return (
    <span className="inline-flex">
      <PeopleDialogButton
        people={readerFirst(item.receivers, readerAccountId)}
        unnamed={RECEIVER_WITH_NO_NAME}
        description={`${feedCardGiver(item.giver, readerAccountId)} gave this Feedback to all of them. Each of them sees who else it was for.`}
      />
    </span>
  );
}

/**
 * What every Feedback card on Home shares: who wrote to whom, never anonymous (`ADR-0022` in the
 * brain), how it came about, the day and who can read it, and a small postcard in the corner, which
 * is the link to the real one. The rest of the card answers no press.
 */
export function FeedCardFrame({
  item,
  readerAccountId,
  target,
  children,
}: FeedCardFrameProps) {
  const { label, Icon } = AUDIENCES[item.visibility];

  return (
    <article className="flex flex-col gap-3 rounded-page bg-action-primary/8 p-5">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1">
        <PhotoAvatar
          name={item.giver.name ?? ''}
          photoUrl={item.giver.photoUrl}
        />
        {/* Beside the small postcard, the two stack; on a phone the meta line would not fit
            there, so this falls away and it runs under the postcard instead. */}
        <div className="contents md:flex md:min-w-0 md:flex-col md:gap-1">
          <Text
            as="div"
            variant="subtitle-4"
            className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 break-words"
          >
            <span>
              {item.giver.accountId === readerAccountId ? (
                'You'
              ) : (
                <PersonName
                  name={feedCardGiver(item.giver, readerAccountId)}
                  inactive={item.giver.inactive}
                />
              )}
            </span>
            <span className="text-fg-secondary">gave feedback</span>
            <span className="text-action-secondary-hover">to</span>
            <Receivers item={item} readerAccountId={readerAccountId} />
          </Text>
          <Text
            as="div"
            variant="body-3"
            tone="muted"
            className="col-start-2 col-end-4 flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span className="text-fg-primary">{ORIGIN_NAMES[item.origin]}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={item.givenAt}>{calendarDay(item.givenAt)}</time>
            <Badge tone="outline">
              <Icon aria-hidden="true" className="size-3" />
              {label}
            </Badge>
          </Text>
        </div>
        <TargetLink
          target={target}
          className="group/card-link col-start-3 row-start-1 block"
        >
          <span className="sr-only">
            Open postcard: {feedCardSentence(item, readerAccountId)}
          </span>
          <MiniPostcard
            kind={item.origin === 'REQUESTED' ? 'requested' : 'offered'}
          />
        </TargetLink>
      </header>
      {children}
    </article>
  );
}
