import type { BadgeTone } from '@/components/atoms/badge';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { CardStamp } from '@/components/molecules/card-stamp';
import { calendarDay } from '@/lib/calendar-day.util';
import { ASK_STATUS_NAMES } from '@/lib/feedback/ask-status.constant';
import type { FeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { SentAsk, SentRequest } from '@/lib/feedback/sent-request.type';
import { AnswerReaders } from './answer-readers';
import { AnswerText } from './answer-text';
import { FeedbackText } from './feedback-text';
import { type GroupPerson, PeopleDialogButton } from './people-dialog-button';
import { PersonChip } from './person-chip';
import { PersonNameList } from './person-name-list';

/** What the card calls somebody who has not introduced themselves yet. */
const UNNAMED = 'a teammate';

export type SentRequestCardProps = {
  request: SentRequest;
  /** The person reading, who sent it: named "You" by their own face. */
  you: FeedbackPerson;
};

function askedPerson(ask: SentAsk): GroupPerson {
  return {
    name: ask.giverName,
    photoUrl: ask.giverPhotoUrl,
    inactive: ask.giverInactive,
    // Nobody asks themself.
    isYou: false,
    status: ask.status,
  };
}

/** What the dialog of people asked says about them, in words as well as rings. */
function describeAsked(asks: readonly SentAsk[]) {
  const answered = asks.filter((ask) => ask.status === 'ANSWERED').length;
  if (answered === asks.length) {
    return 'Everyone answered.';
  }
  return answered === 0
    ? 'Nobody has answered yet.'
    : `${answered} of ${asks.length} answered so far.`;
}

/**
 * The corner says how many answered: green once everyone has, amber while anyone is still
 * waiting, quiet once every Ask that was left expired.
 */
function tallyOf(asks: readonly SentAsk[]): { label: string; tone: BadgeTone } {
  const answered = asks.filter((ask) => ask.status === 'ANSWERED').length;
  const waiting = asks.some((ask) => ask.status === 'PENDING');
  const tone: BadgeTone =
    answered === asks.length ? 'success' : waiting ? 'warning' : 'neutral';
  const [onlyAsk] = asks;
  const label =
    asks.length === 1 && onlyAsk
      ? ASK_STATUS_NAMES[onlyAsk.status]
      : `${answered} of ${asks.length} answered`;
  return { label, tone };
}

/** Who has not answered, in words: still waiting, or their Ask ran out. */
function StillToAnswer({ asks }: { asks: readonly SentAsk[] }) {
  const waiting = asks
    .filter((ask) => ask.status === 'PENDING')
    .map(askedPerson);
  const expired = asks
    .filter((ask) => ask.status === 'EXPIRED')
    .map(askedPerson);
  if (waiting.length === 0 && expired.length === 0) {
    return null;
  }
  return (
    <Text as="p" variant="body-3" tone="muted" className="break-words">
      {waiting.length > 0 && (
        <>
          Still waiting for{' '}
          <PersonNameList people={waiting} unnamed={UNNAMED} />.
        </>
      )}
      {waiting.length > 0 && expired.length > 0 && ' '}
      {expired.length > 0 && (
        <>
          {expired.length === 1 ? 'The Ask to ' : 'The Asks to '}
          <PersonNameList people={expired} unnamed={UNNAMED} /> expired without
          an answer.
        </>
      )}
    </Text>
  );
}

/**
 * One request the person sent, in the feed card's grammar: "[face] You to [faces]", each face
 * ringed by where that person's Ask stands; how many answered over the day it was sent; the
 * Request message; then every answer, who has not answered, and who reads the answers. The
 * answers are here, so reading them takes no second screen.
 */
export function SentRequestCard({ request, you }: SentRequestCardProps) {
  const tally = tallyOf(request.asks);
  // Answers in the order they came, so the newest reads last, as a conversation does.
  const answered = request.asks
    .filter((ask) => ask.answer !== null)
    .sort((left, right) =>
      (left.answer?.answeredAt ?? '').localeCompare(
        right.answer?.answeredAt ?? '',
      ),
    );

  return (
    <article className="flex flex-col gap-3 py-5">
      <header className="flex items-start justify-between gap-3">
        <Text
          as="div"
          variant="subtitle-4"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1"
        >
          <PersonChip person={you} unnamed={UNNAMED} sentenceStart />
          <span className="text-fg-secondary">to</span>
          <PeopleDialogButton
            people={request.asks.map(askedPerson)}
            unnamed={UNNAMED}
            title={
              request.asks.length === 1
                ? 'You asked one person'
                : `You asked ${request.asks.length} people`
            }
            description={describeAsked(request.asks)}
            action="Show where each Ask stands"
          />
        </Text>
        <CardStamp
          label={tally.label}
          tone={tally.tone}
          dateTime={request.sentAt}
        />
      </header>
      <Text as="p" variant="body-1" className="whitespace-pre-line break-words">
        <FeedbackText text={request.message} tags={request.messageTags} />
      </Text>
      {answered.length > 0 && (
        <ul className="flex flex-col divide-y divide-border-muted border-border-muted border-t border-dashed">
          {answered.map(
            (ask) =>
              ask.answer && (
                <li key={ask.askId} className="flex flex-col gap-1.5 py-3">
                  <Text
                    as="p"
                    variant="subtitle-4"
                    className="flex flex-wrap items-center gap-x-1.5"
                  >
                    <PersonChip
                      person={askedPerson(ask)}
                      unnamed={UNNAMED}
                      sentenceStart
                    />
                    <span className="font-normal text-fg-muted">
                      ·{' '}
                      <time dateTime={ask.answer.answeredAt}>
                        {calendarDay(ask.answer.answeredAt)}
                      </time>
                    </span>
                  </Text>
                  <AnswerText>
                    <FeedbackText
                      text={ask.answer.message}
                      tags={ask.answer.messageTags}
                    />
                  </AnswerText>
                </li>
              ),
          )}
        </ul>
      )}
      <StillToAnswer asks={request.asks} />
      {request.readers && <AnswerReaders readers={request.readers} withIcon />}
    </article>
  );
}

/** A `SentRequestCard` still loading: you and the faces asked, the corner, the question. */
export function SentRequestCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Skeleton shape="circle" className="size-6 shrink-0" />
          <Skeleton className="w-10 text-subtitle-4" />
          <Skeleton shape="circle" className="size-6 shrink-0" />
          <Skeleton shape="circle" className="size-6 shrink-0" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <Skeleton shape="circle" className="h-4 w-20" />
          <Skeleton className="w-20 text-body-3" />
        </div>
      </div>
      <Skeleton className="w-4/5 text-body-1" />
      <Skeleton className="w-1/2 text-body-3" />
    </div>
  );
}
