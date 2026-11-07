import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { PendingPostcardMiniature } from '@/components/organisms/postcard-miniature/pending-postcard-miniature';
import { cn } from '@/lib/cn.util';
import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { feedCardAudienceOf } from './feed-card-audience.util';
import { FeedCardColumns } from './feed-card-columns';
import { FeedCardPreview } from './feed-card-preview';
import { feedCardGiver, feedCardSentence } from './feed-card-sentence.util';
import {
  FEED_CARD_KIND_INK,
  FEED_CARD_ORIGIN_TONES as ORIGIN_TONES,
} from './feed-card-tone.constant';
import { FeedCardWho } from './feed-card-who';

const ORIGIN_NAMES: Readonly<Record<HomeFeedItem['origin'], string>> = {
  REQUESTED: 'Answer',
  OFFERED: 'Offered',
};

/**
 * What the note by hand says opening the small postcard gives. A card cuts Offered Feedback at three
 * lines, and shows a request's other answers only as who gave them.
 */
const POSTCARD_NOTES: Readonly<Record<HomeFeedItem['origin'], string>> = {
  REQUESTED: 'All the answers in here',
  OFFERED: 'Read the whole postcard',
};

/** The note for this card. A request holding answers the reader may not read cannot promise them. */
function postcardNoteOf({ origin, request }: HomeFeedItem) {
  const someAreHidden = request?.asked.some(
    (ask) => ask.status === 'ANSWERED' && ask.answer === null,
  );
  return POSTCARD_NOTES[someAreHidden ? 'OFFERED' : origin];
}

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
 * brain), how it came about, the day and who can read it, and in the column beside them the postcard
 * it is on made small, which is the link to the whole one. The rest of the card answers no press.
 */
export function FeedCardFrame({
  item,
  readerAccountId,
  target,
  children,
}: FeedCardFrameProps) {
  const { label, Icon } = feedCardAudienceOf(item, readerAccountId);

  return (
    <FeedCardColumns
      tone={ORIGIN_TONES[item.origin]}
      note={postcardNoteOf(item)}
      aside={
        <FeedCardPreview
          id={item.id}
          target={target}
          label={`Open postcard: ${feedCardSentence(item, readerAccountId)}`}
        >
          <PendingPostcardMiniature card={item.card} size="lg" />
        </FeedCardPreview>
      }
    >
      <header className="flex min-w-0 flex-col gap-2">
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
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <span
            className={cn(
              'font-medium',
              FEED_CARD_KIND_INK[ORIGIN_TONES[item.origin]],
            )}
          >
            {ORIGIN_NAMES[item.origin]}
          </span>
          <span aria-hidden="true">·</span>
          <TimeAgo dateTime={item.givenAt} />
          <Badge tone="outline">
            <Icon aria-hidden="true" className="size-3" />
            {label}
          </Badge>
        </Text>
      </header>
      {children}
    </FeedCardColumns>
  );
}
