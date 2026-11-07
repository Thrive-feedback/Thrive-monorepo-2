import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { AvatarName } from '@/components/molecules/avatar-name';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonName } from '@/components/organisms/person-name';
import type { AskedPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { PendingPostcardMiniature } from '@/components/organisms/postcard-miniature/pending-postcard-miniature';
import { cn } from '@/lib/cn.util';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { FeedCardColumns } from './feed-card-columns';
import { FeedCardPreview } from './feed-card-preview';
import { NO_NAME_STARTING_A_SENTENCE } from './feed-card-sentence.util';
import { FEED_CARD_KIND_INK } from './feed-card-tone.constant';

export type WaitingAskCardProps = {
  ask: MyAsk;
  /** The card the request was sent on, still blank where the answer goes. */
  card: AskedPostcard;
  /** What pressing the small postcard does: it opens the postcard to answer on. */
  target: NavTarget;
};

/**
 * An Ask waiting for the person, drawn as every card in a list is: who asked, that it is a request and
 * how long ago, and the Request message cut at three lines, with the card it was sent on made small in
 * the column beside them. It says nothing about who else can read the answer.
 */
export function WaitingAskCard({ ask, card, target }: WaitingAskCardProps) {
  const name = ask.requesterName ?? NO_NAME_STARTING_A_SENTENCE;

  return (
    <FeedCardColumns
      tone="tertiary"
      note="Answer in the postcard"
      aside={
        <FeedCardPreview
          id={ask.askId}
          target={target}
          label={`Answer in the postcard: ${name} asked you for feedback`}
        >
          <PendingPostcardMiniature card={card} size="lg" />
        </FeedCardPreview>
      }
    >
      <header className="flex min-w-0 flex-col gap-2">
        <Text
          as="div"
          variant="subtitle-4"
          className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 break-words"
        >
          <AvatarName
            name={ask.requesterName ?? ''}
            photoUrl={ask.requesterPhotoUrl}
            size="sm"
          >
            <PersonName name={name} inactive={ask.requesterInactive} />
          </AvatarName>
          <span className="text-fg-secondary">asked you for feedback</span>
        </Text>
        <Text
          as="div"
          variant="body-3"
          tone="muted"
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <span className={cn('font-medium', FEED_CARD_KIND_INK.tertiary)}>
            Asked you
          </span>
          <span aria-hidden="true">·</span>
          <TimeAgo dateTime={ask.askedAt} />
        </Text>
      </header>
      <Text
        as="p"
        variant="body-1"
        className="line-clamp-3 whitespace-pre-line break-words"
      >
        <FeedbackText text={ask.message} tags={ask.messageTags} />
      </Text>
    </FeedCardColumns>
  );
}
