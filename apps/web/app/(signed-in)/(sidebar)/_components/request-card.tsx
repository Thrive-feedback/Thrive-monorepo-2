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
import { TargetLink } from '@/components/molecules/target-link';
import {
  FeedCardNote,
  noteLieOf,
} from '@/components/organisms/feed-card/feed-card-note';
import {
  NO_NAME_IN_A_SENTENCE,
  NO_NAME_STARTING_A_SENTENCE,
} from '@/components/organisms/feed-card/feed-card-sentence.util';
import { FEED_CARD_SURFACE } from '@/components/organisms/feed-card/feed-card-surface.constant';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { PersonName } from '@/components/organisms/person-name';
import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';
import { cn } from '@/lib/cn.util';
import { ASK_STATUS_RINGS } from '@/lib/feedback/ask-status.constant';
import { ROUTES } from '@/lib/routes.constant';
import { timeAgo } from '@/lib/time-ago.util';
import styles from './request-card.module.css';

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
      <AvatarGroup
        aria-hidden="true"
        max={MAX_FACES}
        size="sm"
        className="space-x-1.5 px-0.5"
      >
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
};

/**
 * One answer, as a Feedback card shows the people a request asked: who and when, the first three
 * lines, and beside them the postcard they sent back, as small as the one on every other card. The
 * postcard is the press, as that one is, with the same note by hand pointing at it where there is
 * room.
 */
function AnswerRow({ ask, href }: AnswerRowProps) {
  const { answer } = ask;
  const name = nameOf(ask);

  return (
    <li className={cn('flex items-start gap-3 md:gap-4', styles.answer)}>
      <AvatarName
        name={ask.person.name ?? ''}
        photoUrl={ask.person.photoUrl}
        size="sm"
        className="flex min-w-0 flex-1 items-start"
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
      <div className="flex shrink-0 items-center gap-2">
        <FeedCardNote lie={noteLieOf(answer.id)} className="hidden xl:flex">
          Read the whole postcard
        </FeedCardNote>
        <TargetLink target={{ href }} className="block w-28 lg:w-36">
          <span className="sr-only" suppressHydrationWarning>
            Open postcard: answer from {name}, answered{' '}
            {timeAgo(answer.answeredAt)}.
          </span>
          <span
            style={
              {
                '--request-card-tilt': `${kudosTiltOf(answer.id)}deg`,
              } as React.CSSProperties
            }
            className={cn('block', styles.postcard)}
          >
            <PostcardMiniature card={answer.card} />
          </span>
        </TargetLink>
      </div>
    </li>
  );
}

type PendingRowProps = {
  ask: PersonalRequestAsk;
};

/** Someone still to answer: their name and the word, nothing to press, no time, no colour. */
function PendingRow({ ask }: PendingRowProps) {
  return (
    <li>
      <AvatarName
        name={ask.person.name ?? ''}
        photoUrl={ask.person.photoUrl}
        size="sm"
        className="flex"
        avatarClassName={ASK_STATUS_RINGS.PENDING}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Text as="span" variant="subtitle-4">
            <PersonName name={nameOf(ask)} inactive={ask.person.inactive} />
          </Text>
          <Text as="span" variant="body-3" tone="muted">
            {STANDING.PENDING}
          </Text>
        </div>
      </AvatarName>
    </li>
  );
}

export type RequestCardProps = {
  request: PersonalRequest;
};

/**
 * A request the Member sent, in Received's list, drawn as every Feedback card is: their face, who
 * they asked, a line saying what it is, when and who can read the answers, then the Request message.
 * Under a dashed rule, how many answered, each answer newest first with the postcard its Giver sent
 * back, and everyone still Pending (design FB-4-S4, brain `ADR-0053`). There is no Reaction, no
 * reminder, and nothing about how long anyone has kept them waiting.
 */
export function RequestCard({ request }: RequestCardProps) {
  const show = useReceivedShow();
  const { label, Icon } = requestAudienceOf(request.visibility);
  const { answers, pending } = answeredFirst(request);
  const { answered, asked } = tallyOf(request);

  return (
    <article className={FEED_CARD_SURFACE}>
      <header className="flex items-start gap-3">
        <PhotoAvatar
          name={request.requester.name ?? ''}
          photoUrl={request.requester.photoUrl}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text
            as="div"
            variant="subtitle-4"
            className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 break-words"
          >
            <span>You</span>
            <span className="text-fg-secondary">asked</span>
            <AskedWho request={request} />
          </Text>
          <Text
            as="div"
            variant="body-3"
            tone="muted"
            className="flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span className="text-fg-primary">Request</span>
            <span aria-hidden="true">·</span>
            <TimeAgo dateTime={request.sentAt} />
            <Badge tone="outline">
              <Icon aria-hidden="true" className="size-3" />
              {label}
            </Badge>
          </Text>
        </div>
      </header>
      <Text as="p" variant="body-1" className="whitespace-pre-line break-words">
        <FeedbackText text={request.message} tags={request.messageTags} />
      </Text>
      <div className="flex flex-col gap-3 border-border-muted border-t border-dashed pt-3">
        <Text as="p" variant="body-3" tone="muted">
          {answered} of {asked} answered
        </Text>
        <ul aria-label="Asked" className="flex flex-col gap-3">
          {answers.map((ask) => (
            <AnswerRow
              key={ask.person.accountId}
              ask={ask}
              href={ROUTES.receivedFeedback(ask.answer.id, 'list', show)}
            />
          ))}
          {pending.map((ask) => (
            <PendingRow key={ask.person.accountId} ask={ask} />
          ))}
        </ul>
      </div>
    </article>
  );
}
