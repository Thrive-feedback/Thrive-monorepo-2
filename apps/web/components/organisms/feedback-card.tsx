import type { BadgeTone } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { CardStamp } from '@/components/molecules/card-stamp';
import {
  type AnsweredRequest,
  type FeedItem,
} from '@/lib/feedback/feed-item.type';
import { FeedbackText } from './feedback-text';
import { GiverToReceivers } from './giver-to-receivers';
import { PersonName } from './person-name';
import { PersonNameList } from './person-name-list';
import { ReactionBar } from './reaction-bar';

const ORIGIN_NAMES: Readonly<Record<FeedItem['origin'], string>> = {
  REQUESTED: 'Requested',
  OFFERED: 'Offered',
};

/**
 * Each kind is told apart by form as well as colour: what was given unasked wears the second
 * brand colour, an answer stays outlined because the request below it already says what it is.
 */
const ORIGIN_TONES: Readonly<Record<FeedItem['origin'], BadgeTone>> = {
  REQUESTED: 'outline',
  OFFERED: 'highlight',
};

export type FeedbackCardProps = {
  item: FeedItem;
};

/** What the line under an answer calls somebody who has not introduced themselves yet. */
const UNNAMED = 'a teammate';

/**
 * What an answer responds to, after it: who asked, everyone they asked — names only, never who
 * did or did not answer — and the Request message. The answer stays the card's main text, read
 * first (`ADR-0039`, `ADR-0046` in the brain).
 */
function InAnswerTo({ request }: { request: AnsweredRequest }) {
  return (
    <Text
      as="p"
      variant="body-3"
      tone="muted"
      className="break-words border-border-muted border-t border-dashed pt-3"
    >
      In answer to{' '}
      <PersonName
        name={request.requester.name ?? UNNAMED}
        inactive={request.requester.inactive}
      />
      , who asked <PersonNameList people={request.asked} unnamed={UNNAMED} />:{' '}
      <span className="text-fg-primary">
        <FeedbackText text={request.message} tags={request.messageTags} />
      </span>
    </Text>
  );
}

/**
 * One piece of Feedback on a feed: who gave it to whom — never anonymous (`ADR-0022`) — whether
 * it was asked for and the day, in the corner, the Feedback message, and the Reactions. The
 * message is the card's main text: there is no headline above it (`ADR-0039` in the brain).
 *
 * An answer on the Workspace feed also says what it answers, under the message (`ADR-0046`).
 */
export function FeedbackCard({ item }: FeedbackCardProps) {
  return (
    <article className="flex flex-col gap-3 py-5">
      <header className="flex items-start justify-between gap-3">
        <GiverToReceivers
          giver={{
            name: item.giverName,
            photoUrl: item.giverPhotoUrl,
            inactive: item.giverInactive,
          }}
          receivers={item.receivers}
          kind="Feedback"
        />
        <CardStamp
          label={ORIGIN_NAMES[item.origin]}
          tone={ORIGIN_TONES[item.origin]}
          dateTime={item.givenAt}
        />
      </header>
      <Text as="p" variant="body-1" className="whitespace-pre-line break-words">
        <FeedbackText text={item.message} tags={item.messageTags} />
      </Text>
      {item.request && <InAnswerTo request={item.request} />}
      <ReactionBar reactions={item.reactions} />
    </article>
  );
}
