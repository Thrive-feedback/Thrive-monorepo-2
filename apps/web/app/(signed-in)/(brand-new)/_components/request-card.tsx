import {
  CheckIcon,
  ChevronRightIcon,
  MessageCircleQuestionMarkIcon,
} from 'lucide-react';
import type {
  PersonalRequest,
  PersonalRequestAsk,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import {
  answeredFirst,
  askedLine,
  requestAudienceOf,
  tallyOf,
} from '@/app/(signed-in)/(brand-new)/_lib/request-card.util';
import { useReceivedShow } from '@/app/(signed-in)/(brand-new)/_lib/use-received-show';
import { Badge } from '@/components/atoms/badge';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { NO_NAME_STARTING_A_SENTENCE } from '@/components/organisms/feed-card/feed-card-sentence.util';
import { FEED_CARD_SURFACE } from '@/components/organisms/feed-card/feed-card-surface.constant';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { PersonName } from '@/components/organisms/person-name';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { timeAgo } from '@/lib/time-ago.util';
import { PostcardMiniature } from './postcard-miniature';
import styles from './request-card.module.css';

type FaceProps = {
  ask: PersonalRequestAsk;
  size?: 'sm' | 'md';
};

/** Someone asked, ringed solid once they answered and dashed while Pending. */
export function RequestFace({ ask, size = 'md' }: FaceProps) {
  return (
    <PhotoAvatar
      name={ask.person.name ?? ''}
      photoUrl={ask.person.photoUrl}
      size={size}
      className={cn(
        'outline-2 outline-offset-1',
        ask.status === 'ANSWERED'
          ? 'outline-status-success outline-solid'
          : 'outline-border-strong outline-dashed',
      )}
    />
  );
}

type TallyProps = {
  request: PersonalRequest;
};

/** Everyone asked as a stack of faces, and how many answered, in words neutral at any count. */
export function RequestTally({ request }: TallyProps) {
  const { answered, asked } = tallyOf(request);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Apart rather than overlapping, so each ring, solid or dashed, can be told from the next. */}
      <div aria-hidden="true" className="flex shrink-0 gap-2.5 ps-0.5">
        {request.asked.map((ask) => (
          <RequestFace key={ask.person.accountId} ask={ask} size="sm" />
        ))}
      </div>
      <Text as="p" variant="body-3" tone="muted">
        {answered} of {asked} answered
      </Text>
    </div>
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
 * One answer: who and when, the first three lines, and the postcard they sent back beside it, below
 * it on a phone. The whole row is one press, which opens that postcard.
 */
function AnswerRow({ ask, href }: AnswerRowProps) {
  const { answer } = ask;
  const name = nameOf(ask);

  return (
    <li
      className={cn(
        'relative flex flex-col gap-3 rounded-element p-2 hover:bg-action-neutral-surface-hover md:flex-row md:items-start md:gap-4',
        styles.answer,
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="relative h-fit shrink-0">
          <RequestFace ask={ask} />
          <span
            aria-hidden="true"
            className="absolute -end-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-status-success text-fg-on-success ring-2 ring-surface-base"
          >
            <CheckIcon className="size-3" />
          </span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text
            as="p"
            variant="body-3"
            tone="muted"
            className="flex flex-wrap items-center gap-x-2"
          >
            <span className="text-fg-primary text-subtitle-4">
              <PersonName name={name} inactive={ask.person.inactive} />
            </span>
            <span>
              Answered <TimeAgo dateTime={answer.answeredAt} />
            </span>
          </Text>
          <Text as="p" variant="body-2" className="line-clamp-3 break-words">
            <FeedbackText text={answer.message} tags={answer.messageTags} />
          </Text>
          <Link
            href={href}
            scroll={false}
            className={cn(
              'inline-flex w-fit items-center gap-0.5 text-body-3 after:absolute after:inset-0 after:rounded-element',
              styles.press,
            )}
          >
            <span aria-hidden="true">View postcard</span>
            <ChevronRightIcon aria-hidden="true" className="size-4" />
            <span className="sr-only" suppressHydrationWarning>
              Open postcard: answer from {name}, answered{' '}
              {timeAgo(answer.answeredAt)}.
            </span>
          </Link>
        </div>
      </div>
      <span
        style={
          {
            '--request-card-tilt': `${kudosTiltOf(answer.id)}deg`,
          } as React.CSSProperties
        }
        className={cn(
          'w-full max-w-60 self-center md:w-48 md:shrink-0',
          styles.postcard,
        )}
      >
        <PostcardMiniature card={answer.card} />
      </span>
    </li>
  );
}

type PendingRowProps = {
  ask: PersonalRequestAsk;
};

/** Someone still to answer: their name and the word, nothing to press, no time, no colour. */
function PendingRow({ ask }: PendingRowProps) {
  return (
    <li className="flex items-center gap-3 p-2">
      <RequestFace ask={ask} />
      <Text as="p" variant="body-2" className="min-w-0 flex-1 truncate">
        <PersonName name={nameOf(ask)} inactive={ask.person.inactive} />
      </Text>
      <Text as="span" variant="body-3" tone="muted">
        Pending
      </Text>
    </li>
  );
}

export type RequestCardProps = {
  request: PersonalRequest;
};

/**
 * A request the Member sent, in Received's list: who they asked and who can read the answers, the
 * Request message in full, how many answered, then each answer, newest first, with the postcard its
 * Giver sent back, and everyone still Pending (design FB-4-S4, brain `ADR-0053`). There is no
 * Reaction, no reminder, and nothing about how long anyone has kept them waiting.
 */
export function RequestCard({ request }: RequestCardProps) {
  const show = useReceivedShow();
  const { label, Icon } = requestAudienceOf(request.visibility);
  const { answers, pending } = answeredFirst(request);

  return (
    <article className={FEED_CARD_SURFACE}>
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <MessageCircleQuestionMarkIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-fg-secondary"
        />
        <Text as="p" variant="subtitle-4">
          {askedLine(request)}
        </Text>
        <Badge tone="outline">
          <Icon aria-hidden="true" className="size-3" />
          {label}
        </Badge>
        <Text as="p" variant="body-3" tone="muted" className="ms-auto">
          <TimeAgo dateTime={request.sentAt} />
        </Text>
      </header>
      <Text
        as="p"
        variant="subtitle-display-2"
        className="whitespace-pre-line break-words"
      >
        <FeedbackText text={request.message} tags={request.messageTags} />
      </Text>
      <RequestTally request={request} />
      <ul aria-label="Asked" className="-mx-2 flex flex-col gap-1">
        {answers.map((ask) => (
          <AnswerRow
            key={ask.person.accountId}
            ask={ask}
            href={ROUTES.brandNewReceivedFeedback(ask.answer.id, 'list', show)}
          />
        ))}
        {pending.map((ask) => (
          <PendingRow key={ask.person.accountId} ask={ask} />
        ))}
      </ul>
    </article>
  );
}
