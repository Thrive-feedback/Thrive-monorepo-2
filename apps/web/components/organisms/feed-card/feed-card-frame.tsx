import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { TargetLink } from '@/components/molecules/target-link';
import { cn } from '@/lib/cn.util';
import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { feedCardAudienceOf } from './feed-card-audience.util';
import styles from './feed-card-frame.module.css';
import { FeedCardNote, noteLieOf } from './feed-card-note';
import { feedCardGiver, feedCardSentence } from './feed-card-sentence.util';
import { FEED_CARD_SURFACE } from './feed-card-surface.constant';
import { FeedCardWho } from './feed-card-who';
import { PendingMiniPostcard } from './pending-mini-postcard';

const ORIGIN_NAMES: Readonly<Record<HomeFeedItem['origin'], string>> = {
  REQUESTED: 'Requested',
  OFFERED: 'Offered',
};

/**
 * The note by hand pointing at the small postcard, saying what opening it gives. A card cuts Offered
 * Feedback at three lines, and shows a request's other answers only as who gave them.
 */
const POSTCARD_NOTES: Readonly<Record<HomeFeedItem['origin'], string>> = {
  REQUESTED: 'All the answers in here',
  OFFERED: 'Read the whole postcard',
};

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
 * What every Feedback card on Home shares: who wrote to whom, never anonymous (`ADR-0022` in the
 * brain), how it came about, the day and who can read it, and a small postcard in the corner, which
 * is the link to the real one, with a note by hand pointing at it where there is room. The rest of
 * the card answers no press.
 */
export function FeedCardFrame({
  item,
  readerAccountId,
  target,
  children,
}: FeedCardFrameProps) {
  const { label, Icon } = feedCardAudienceOf(item);

  return (
    <article className={FEED_CARD_SURFACE}>
      <header className={cn('grid items-start gap-x-3 gap-y-1', styles.header)}>
        <PhotoAvatar
          name={item.giver.name ?? ''}
          photoUrl={item.giver.photoUrl}
        />
        {/* Beside the small postcard, the two stack; on a phone the meta line would not fit
            there, so this falls away and it runs under the postcard instead. */}
        <div className="contents md:flex md:min-w-0 md:flex-col md:gap-1">
          <FeedCardWho
            giver={item.giver}
            receivers={item.receivers}
            verb="gave feedback"
            peopleDescription={`${feedCardGiver(item.giver, readerAccountId)} gave this Feedback to all of them. Each of them sees who else it was for.`}
            readerAccountId={readerAccountId}
          />
          <Text
            as="div"
            variant="body-3"
            tone="muted"
            className="col-start-2 col-end-4 flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span className="text-fg-primary">{ORIGIN_NAMES[item.origin]}</span>
            <span aria-hidden="true">·</span>
            <TimeAgo dateTime={item.givenAt} />
            <Badge tone="outline">
              <Icon aria-hidden="true" className="size-3" />
              {label}
            </Badge>
          </Text>
        </div>
        <div className="col-start-3 row-start-1 flex items-center gap-2">
          <FeedCardNote lie={noteLieOf(item.id)} className="hidden xl:flex">
            {POSTCARD_NOTES[item.origin]}
          </FeedCardNote>
          <TargetLink target={target} className="group/card-link block">
            <span className="sr-only">
              Open postcard: {feedCardSentence(item, readerAccountId)}
            </span>
            <PendingMiniPostcard
              kind={item.origin === 'REQUESTED' ? 'requested' : 'offered'}
              date={item.givenAt}
            />
          </TargetLink>
        </div>
      </header>
      {children}
    </article>
  );
}
