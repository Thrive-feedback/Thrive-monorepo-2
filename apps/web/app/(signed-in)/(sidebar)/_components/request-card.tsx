import type {
  PersonalRequest,
  PersonalRequestAsk,
} from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import {
  answeredFirst,
  requestAudienceOf,
  tallyOf,
} from '@/app/(signed-in)/(sidebar)/_lib/request-card.util';
import { useReceivedShow } from '@/app/(signed-in)/(sidebar)/_lib/use-received-show';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { AvatarGroup } from '@/components/molecules/avatar-group';
import { AvatarName } from '@/components/molecules/avatar-name';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import {
  FeedCardRow,
  FeedCardSurface,
} from '@/components/organisms/feed-card/feed-card-columns';
import { FeedCardNote } from '@/components/organisms/feed-card/feed-card-note';
import { FeedCardPreview } from '@/components/organisms/feed-card/feed-card-preview';
import {
  NO_NAME_IN_A_SENTENCE,
  NO_NAME_STARTING_A_SENTENCE,
} from '@/components/organisms/feed-card/feed-card-sentence.util';
import { FEED_CARD_INK } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonName } from '@/components/organisms/person-name';
import { PendingPostcardMiniature } from '@/components/organisms/postcard-miniature/pending-postcard-miniature';
import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';
import { cn } from '@/lib/cn.util';
import { ASK_STATUS_RINGS } from '@/lib/feedback/ask-status.constant';
import { ROUTES } from '@/lib/routes.constant';
import { timeAgo } from '@/lib/time-ago.util';

/** Past this many faces, the rest become one "+N", as everywhere a stack of faces is drawn. */
const MAX_FACES = 4;

/** Where somebody asked stands, in the word alone: Pending is neutral (design FB-4-S4). */
const STANDING: Readonly<Record<PersonalRequestAsk['status'], string>> = {
  PENDING: 'Pending',
  ANSWERED: 'Answered',
};

type TallyProps = {
  request: PersonalRequest;
};

/**
 * Everyone asked as a row of faces, each ringed by where they stand, and how many answered, in words
 * neutral at any count. It sits inside a tile that is one press, so the faces are drawn, not a
 * button of their own.
 */
export function RequestTally({ request }: TallyProps) {
  const { answered, asked } = tallyOf(request);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <AvatarGroup aria-hidden="true" max={MAX_FACES} size="sm">
        {request.asked.map((ask) => (
          <PhotoAvatar
            key={ask.person.accountId}
            name={ask.person.name ?? ''}
            photoUrl={ask.person.photoUrl}
            size="sm"
            className={ASK_STATUS_RINGS[ask.status]}
          />
        ))}
      </AvatarGroup>
      <Text as="p" variant="body-3" tone="muted">
        {answered} of {asked} answered
      </Text>
    </div>
  );
}

/**
 * Who a request asked, at the end of its opening line: one person's face and name, or several as a
 * small stack, which lists each of them and where they stand on a press.
 */
function AskedWho({ request }: TallyProps) {
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
            trailing: (
              <Text as="span" variant="body-3" tone="muted">
                {STANDING[ask.status]}
              </Text>
            ),
          };
        })}
        max={MAX_FACES}
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
  /** A note by hand pointing at its postcard: the first answer's alone, so a reader learns to press them. */
  note?: string;
};

/**
 * One answer, as a Feedback card shows the people a request asked: who and when, and the first three
 * lines, with the postcard they sent back in the column beside it, centred on the same line. Pointed
 * at anywhere, or with its postcard focused, the row lightens towards the page across both columns
 * and its postcard straightens, so which card is whose is never a guess. Only the postcard is a
 * press: it opens that answer.
 *
 * The lit row's corners run parallel to the card's: it stands 12px inside the card's edge at the
 * sides, and at the bottom when it is the last row, and its corner is the card's less those 12px.
 * The card is padded by 6.25 steps, so reaching out by 3.25 leaves the 3 steps (12px) between, and
 * the control corner (9px) plus those 12px is the page corner (21px) the card has.
 */
function AnswerRow({ ask, href, note }: AnswerRowProps) {
  const { answer } = ask;
  const name = nameOf(ask);

  return (
    <li
      data-feed-card-row
      className="-mx-3.25 rounded-control px-3.25 transition-colors last:-mb-3.25 last:pb-3.25 hover:bg-surface-base/70 has-focus-visible:bg-surface-base/70"
    >
      <FeedCardRow
        note={note && <FeedCardNote tone="tertiary">{note}</FeedCardNote>}
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
              Answered <TimeAgo dateTime={answer.answeredAt} />
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
    <li>
      <FeedCardRow>
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
                  <Text as="span" variant="body-3" tone="muted">
                    {STANDING.PENDING}
                  </Text>
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
 * the top already say how many answered. While nobody has answered, the request's own card stands beside it,
 * with nothing to open. There is no Reaction, no reminder, and nothing about how long anyone has kept
 * them waiting.
 */
export function RequestCard({ request }: RequestCardProps) {
  const show = useReceivedShow();
  const { label, Icon } = requestAudienceOf(request.visibility);
  const { answers, pending } = answeredFirst(request);

  return (
    <FeedCardSurface tone="tertiary">
      <FeedCardRow
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
            <span className={cn('font-medium', FEED_CARD_INK.tertiary)}>
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
            note={place === 0 ? 'Read their postcards' : undefined}
          />
        ))}
        {pending.length > 0 && <PendingRows pending={pending} />}
      </ul>
    </FeedCardSurface>
  );
}
