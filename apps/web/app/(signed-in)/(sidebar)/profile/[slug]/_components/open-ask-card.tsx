import type { ProfilePendingAsk } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile-item.type';
import { waitingFor } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/waiting-for.util';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { FeedCardColumns } from '@/components/organisms/feed-card/feed-card-columns';
import { FeedCardPreview } from '@/components/organisms/feed-card/feed-card-preview';
import {
  NO_NAME_IN_A_SENTENCE,
  NO_NAME_STARTING_A_SENTENCE,
} from '@/components/organisms/feed-card/feed-card-sentence.util';
import { FEED_CARD_KIND_INK } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonName } from '@/components/organisms/person-name';
import { PendingPostcardMiniature } from '@/components/organisms/postcard-miniature/pending-postcard-miniature';
import { calendarDay } from '@/lib/calendar-day.util';
import { cn } from '@/lib/cn.util';
import type { HomeFeedPerson } from '@/lib/feedback/home-feed-item.type';
import { ROUTES } from '@/lib/routes.constant';

export type OpenAskCardProps = {
  /** An Ask open between the reader and the Member, whichever of them asked. */
  ask: ProfilePendingAsk;
  /** Who is reading, which says which way the Ask goes. */
  readerAccountId: string;
};

type OtherProps = {
  person: HomeFeedPerson;
  /** Leads the sentence, so a nameless person is "A teammate" rather than "a teammate". */
  first: boolean;
};

/** The other of the two, by face and name, in the sentence that says who asked whom. */
function Other({ person, first }: OtherProps) {
  return (
    <AvatarName name={person.name ?? ''} photoUrl={person.photoUrl} size="sm">
      <PersonName
        name={
          person.name ??
          (first ? NO_NAME_STARTING_A_SENTENCE : NO_NAME_IN_A_SENTENCE)
        }
        inactive={person.inactive}
      />
    </AvatarName>
  );
}

/**
 * An Ask open between the reader and the Member, drawn as every card in a list is: who asked whom,
 * how long it has waited in days, and the Request message cut at three lines, with the card it was
 * sent on made small beside them. Asked of the reader, its small card opens it to answer. Asked by
 * the reader, it opens their requests. It says nothing about who else can read the answer.
 */
export function OpenAskCard({ ask, readerAccountId }: OpenAskCardProps) {
  const isForReader = ask.asked.accountId === readerAccountId;
  const other = isForReader ? ask.requester : ask.asked;
  const otherName = other.name ?? NO_NAME_IN_A_SENTENCE;

  return (
    <FeedCardColumns
      tone="tertiary"
      note={isForReader ? 'Answer in the postcard' : undefined}
      aside={
        <FeedCardPreview
          id={ask.id}
          target={{
            href: isForReader
              ? ROUTES.waitingAsk(ask.id)
              : ROUTES.receivedViewing('list', 'requests'),
          }}
          label={
            isForReader
              ? `Answer in the postcard: ${other.name ?? NO_NAME_STARTING_A_SENTENCE} asked you for feedback`
              : `Your requests: you asked ${otherName} for feedback`
          }
        >
          <PendingPostcardMiniature card={ask.card} size="lg" />
        </FeedCardPreview>
      }
    >
      <header className="flex min-w-0 flex-col gap-2">
        <Text
          as="div"
          variant="subtitle-4"
          className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 break-words"
        >
          {isForReader ? (
            <>
              <Other person={other} first />
              <span className="text-fg-secondary">asked you for feedback</span>
            </>
          ) : (
            <>
              <span className="text-fg-secondary">You asked</span>
              <Other person={other} first={false} />
              <span className="text-fg-secondary">for feedback</span>
            </>
          )}
        </Text>
        <Text
          as="div"
          variant="body-3"
          tone="muted"
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <span className={cn('font-medium', FEED_CARD_KIND_INK.tertiary)}>
            Open ask
          </span>
          <span aria-hidden="true">·</span>
          <time
            dateTime={ask.askedAt}
            title={calendarDay(ask.askedAt)}
            suppressHydrationWarning
          >
            {waitingFor(ask.askedAt)}
          </time>
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
