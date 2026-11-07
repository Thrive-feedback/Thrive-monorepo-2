import type {
  PersonalRequest,
  PersonalRequestAsk,
} from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import { REQUEST_MAX_FACES } from '@/app/(signed-in)/(sidebar)/_lib/request-card.constant';
import {
  answeredFirst,
  requestAudienceOf,
} from '@/app/(signed-in)/(sidebar)/_lib/request-card.util';
import { useReceivedShow } from '@/app/(signed-in)/(sidebar)/_lib/use-received-show';
import { Badge } from '@/components/atoms/badge';
import { StatusText } from '@/components/atoms/status-text';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { AvatarGroup } from '@/components/molecules/avatar-group';
import { AvatarName } from '@/components/molecules/avatar-name';
import {
  FeedCardRow,
  FeedCardSurface,
} from '@/components/organisms/feed-card/feed-card-columns';
import { FeedCardPreview } from '@/components/organisms/feed-card/feed-card-preview';
import {
  NO_NAME_IN_A_SENTENCE,
  NO_NAME_STARTING_A_SENTENCE,
} from '@/components/organisms/feed-card/feed-card-sentence.util';
import { FEED_CARD_KIND_INK } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonName } from '@/components/organisms/person-name';
import { PendingPostcardMiniature } from '@/components/organisms/postcard-miniature/pending-postcard-miniature';
import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';
import { cn } from '@/lib/cn.util';
import {
  ASK_STATUS_NAMES,
  ASK_STATUS_RINGS,
  ASK_STATUS_TONES,
} from '@/lib/feedback/ask-status.constant';
import { ROUTES } from '@/lib/routes.constant';
import { timeAgo } from '@/lib/time-ago.util';

/**
 * Where somebody asked stands, in the word and the colour every screen gives it, as text in the
 * line beside their name, as a requested Feedback card counts them: green answered, yellow pending.
 */
function AskStanding({ status }: Pick<PersonalRequestAsk, 'status'>) {
  return (
    <StatusText tone={ASK_STATUS_TONES[status]} className="text-body-3">
      {ASK_STATUS_NAMES[status]}
    </StatusText>
  );
}

type AskedWhoProps = {
  request: PersonalRequest;
};

/**
 * Who a request asked, at the end of its opening line: one person's face and name, or several as a
 * small stack, which lists each of them and where they stand on a press.
 */
function AskedWho({ request }: AskedWhoProps) {
  const [only] = request.asked;

  if (request.asked.length === 1 && only) {
    return (
      <AvatarName
        name={only.person.name ?? ''}
        photoUrl={only.person.photoUrl}
        size="sm"
        avatarClassName={ASK_STATUS_RINGS[only.status]}
      >
        <PersonName
          name={only.person.name ?? NO_NAME_IN_A_SENTENCE}
          inactive={only.person.inactive}
        />
      </AvatarName>
    );
  }
  return (
    <span className="inline-flex">
      <AvatarGroup
        people={request.asked.map((ask) => {
          const name = ask.person.name ?? NO_NAME_STARTING_A_SENTENCE;
          return {
            id: ask.person.accountId,
            name: ask.person.name ?? '',
            photoUrl: ask.person.photoUrl,
            label: ask.person.inactive ? `${name} (inactive)` : name,
            isMuted: ask.person.inactive,
            avatarClassName: ASK_STATUS_RINGS[ask.status],
            trailing: <AskStanding status={ask.status} />,
          };
        })}
        max={REQUEST_MAX_FACES}
        size="sm"
        listTitle={`You asked ${request.asked.length} people`}
        listDescription="You asked them the same question."
        listLabel="Show who you asked"
      />
    </span>
  );
}

function nameOf(ask: PersonalRequestAsk) {
  return ask.person.name ?? NO_NAME_STARTING_A_SENTENCE;
}

type AnswerRowProps = {
  ask: PersonalRequestAsk & {
    answer: NonNullable<PersonalRequestAsk['answer']>;
  };
  href: string;
  /**
   * Whether this is the newest answer. Every answer's postcard gets a note by hand on a phone, where
   * the rows stand far apart; beside the words only the newest one does, so a reader learns to press
   * them without a note on each.
   */
  isNewest: boolean;
};

/**
 * One answer, as a Feedback card shows the people a request asked: who and when, and the first three
 * lines, with the postcard they sent back in the column beside it, centred on the same line. Pointed
 * at anywhere, or with its postcard focused, the row lightens towards the page across both columns
 * and its postcard straightens, so which card is whose is never a guess. Only the postcard is a
 * press: it opens that answer.
 *
 * The lit row stands 16px inside the card's edge at the sides, and at the bottom when it is the last
 * row. The card is padded by 6.25 steps at the sides and 5 at the top and bottom, so the row reaches
 * out by 2.25 at the sides and by 1 at the bottom to leave those 16px. Its corner is the control
 * corner (9px), rounder than the card's less the gap, so the lit row reads as soft.
 *
 * Inside it, the face stands as far from the row's left edge as the postcard does from its right,
 * so the lit row is even on both sides. The postcard is centred in its column, so that distance is
 * set by the column: 3.5 steps beside the narrower one (`md`), 5.5 beside the wider one (`lg`). On a
 * phone the postcard drops under the words, and both sides keep the row's own 2.25.
 */
function AnswerRow({ ask, href, isNewest }: AnswerRowProps) {
  const { answer } = ask;
  const name = nameOf(ask);

  return (
    <li
      data-feed-card-row
      className="-mx-2.25 rounded-control px-2.25 transition-colors last:-mb-1 last:pb-1 hover:bg-surface-base/70 has-focus-visible:bg-surface-base/70 md:ps-3.5 lg:ps-5.5"
    >
      <FeedCardRow
        tone="tertiary"
        note="Read their postcards"
        isNotePhoneOnly={!isNewest}
        aside={
          <FeedCardPreview
            id={answer.id}
            target={{ href }}
            label={`Open postcard: answer from ${name}, answered ${timeAgo(answer.answeredAt)}.`}
          >
            <PendingPostcardMiniature card={answer.card} size="lg" />
          </FeedCardPreview>
        }
      >
        <AvatarName
          name={ask.person.name ?? ''}
          photoUrl={ask.person.photoUrl}
          size="sm"
          className="flex items-start py-3"
          avatarClassName={ASK_STATUS_RINGS.ANSWERED}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Text as="span" variant="subtitle-4">
              <PersonName name={name} inactive={ask.person.inactive} />
            </Text>
            <Text as="span" variant="body-3" tone="muted">
              <AskStanding status="ANSWERED" />{' '}
              <TimeAgo dateTime={answer.answeredAt} />
            </Text>
          </div>
          <Text
            as="p"
            variant="body-3"
            className="mt-1 line-clamp-3 whitespace-pre-line break-words"
          >
            <FeedbackText text={answer.message} tags={answer.messageTags} />
          </Text>
        </AvatarName>
      </FeedCardRow>
    </li>
  );
}

type PendingRowsProps = {
  pending: readonly PersonalRequestAsk[];
};

/**
 * Everyone still to answer, together after the answers: their face ringed yellow, their name and the
 * word, nothing to press, no time. With no postcard, they need no row each.
 */
function PendingRows({ pending }: PendingRowsProps) {
  return (
    // Indented by what an answer row adds inside its edge, so every face down the card lines up.
    <li className="md:ps-1.25 lg:ps-3.25">
      <FeedCardRow tone="tertiary">
        <ul className="flex flex-col gap-3 py-3">
          {pending.map((ask) => (
            <li key={ask.person.accountId}>
              <AvatarName
                name={ask.person.name ?? ''}
                photoUrl={ask.person.photoUrl}
                size="sm"
                className="flex"
                avatarClassName={ASK_STATUS_RINGS.PENDING}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Text as="span" variant="subtitle-4">
                    <PersonName
                      name={nameOf(ask)}
                      inactive={ask.person.inactive}
                    />
                  </Text>
                  <AskStanding status="PENDING" />
                </div>
              </AvatarName>
            </li>
          ))}
        </ul>
      </FeedCardRow>
    </li>
  );
}

export type RequestCardProps = {
  request: PersonalRequest;
};

/**
 * A request the Member sent, in Received's list, in the two columns every card in a list has: they
 * and who they asked, each with a face, a line saying what it is, when and who can read the answers,
 * then the Request message. Under it a row for each answer, newest first, with the postcard its Giver
 * sent back beside it, then everyone still Pending (design FB-4-S4, brain `ADR-0053`); the faces at
 * the top already say how many answered. While nobody has answered, the request's own card stands
 * beside it, with nothing to open. There is no Reaction, no reminder, and nothing about how long
 * anyone has kept them waiting.
 */
export function RequestCard({ request }: RequestCardProps) {
  const show = useReceivedShow();
  const { label, Icon } = requestAudienceOf(request.visibility);
  const { answers, pending } = answeredFirst(request);

  return (
    <FeedCardSurface tone="tertiary">
      <FeedCardRow
        tone="tertiary"
        aside={
          answers.length === 0 ? (
            <FeedCardPreview id={request.id}>
              <PostcardMiniature card={request.card} size="lg" />
            </FeedCardPreview>
          ) : undefined
        }
      >
        <header className="flex min-w-0 flex-col gap-2">
          <Text
            as="div"
            variant="subtitle-4"
            className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 break-words"
          >
            <AvatarName
              name={request.requester.name ?? ''}
              photoUrl={request.requester.photoUrl}
              size="sm"
            >
              You
            </AvatarName>
            <span className="text-fg-secondary">asked</span>
            <AskedWho request={request} />
          </Text>
          <Text
            as="div"
            variant="body-3"
            tone="muted"
            className="flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span className={cn('font-medium', FEED_CARD_KIND_INK.tertiary)}>
              Your request
            </span>
            <span aria-hidden="true">·</span>
            <TimeAgo dateTime={request.sentAt} />
            <Badge tone="outline">
              <Icon aria-hidden="true" className="size-3" />
              {label}
            </Badge>
          </Text>
        </header>
        <Text
          as="p"
          variant="body-1"
          className="whitespace-pre-line break-words pb-3"
        >
          <FeedbackText text={request.message} tags={request.messageTags} />
        </Text>
      </FeedCardRow>
      <ul aria-label="Asked" className="flex flex-col">
        {answers.map((ask, place) => (
          <AnswerRow
            key={ask.person.accountId}
            ask={ask}
            href={ROUTES.receivedFeedback(ask.answer.id, 'list', show)}
            isNewest={place === 0}
          />
        ))}
        {pending.length > 0 && <PendingRows pending={pending} />}
      </ul>
    </FeedCardSurface>
  );
}
