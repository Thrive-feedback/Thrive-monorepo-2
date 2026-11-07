'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { link } from '@/components/atoms/link';
import { StatusText } from '@/components/atoms/status-text';
import { Text } from '@/components/atoms/text';
import { AvatarGroup } from '@/components/molecules/avatar-group';
import { AvatarName } from '@/components/molecules/avatar-name';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonName } from '@/components/organisms/person-name';
import { cn } from '@/lib/cn.util';
import {
  ASK_STATUS_NAMES,
  ASK_STATUS_RINGS,
  ASK_STATUS_TONES,
} from '@/lib/feedback/ask-status.constant';
import type {
  HomeFeedAsk,
  HomeFeedRequest,
} from '@/lib/feedback/home-feed-item.type';
import { feedCardGiver } from './feed-card-sentence.util';
import { useIsCutOff } from './use-is-cut-off';

/**
 * How many people show before the rest wait behind a press, so a card stays one card's height: this
 * card's writer and two more.
 */
const PEOPLE_AT_FIRST = 3;

/** Past this many faces, the rest become one "+N", as everywhere a stack of faces is drawn. */
const MAX_FACES = 4;

type StandingProps = {
  answers: number;
  pending: number;
};

/** Where everyone asked stands, in a few words: those who answered in green, those waiting in yellow. */
function Standing({ answers, pending }: StandingProps) {
  return (
    <>
      {answers > 0 && (
        <StatusText tone={ASK_STATUS_TONES.ANSWERED}>
          {answers} answered
        </StatusText>
      )}
      {answers > 0 && pending > 0 && ', '}
      {pending > 0 && (
        <StatusText tone={ASK_STATUS_TONES.PENDING}>
          {pending} pending
        </StatusText>
      )}
    </>
  );
}

type AskStatusProps = Pick<HomeFeedAsk, 'status'> & {
  /** Whether this Ask is the one the card shows the answer to. */
  isThisCard: boolean;
};

/**
 * Where one Ask stands, in the word and the colour every screen gives it, as text beside the name,
 * as the line that counts them says it. The Ask this card answers says so instead, in the blue of
 * everything asked, since its answer is the one already above.
 */
function AskStatus({ status, isThisCard }: AskStatusProps) {
  return isThisCard ? (
    <StatusText tone="info" className="text-body-3">
      This answer
    </StatusText>
  ) : (
    <StatusText tone={ASK_STATUS_TONES[status]} className="text-body-3">
      {ASK_STATUS_NAMES[status]}
    </StatusText>
  );
}

type TextToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
};

/** A press that opens or closes text, as quiet as a link, so it never outweighs what it opens. */
function TextToggle({
  isOpen,
  onToggle,
  children,
  className,
}: TextToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={cn(link(), 'cursor-pointer text-body-3', className)}
    >
      {children}
    </button>
  );
}

type AskAnswerProps = {
  answer: NonNullable<HomeFeedAsk['answer']>;
  /** Who wrote it, so a screen reader can tell one "Read more" from another. */
  writer: string;
};

/** What somebody answered, cut at two lines. A press opens all of it, only when some was cut. */
function AskAnswer({ answer, writer }: AskAnswerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const isCutOff = useIsCutOff(textRef, !isOpen);

  return (
    <>
      <Text
        ref={textRef}
        as="p"
        variant="body-3"
        className={cn(
          'mt-1 whitespace-pre-line break-words',
          !isOpen && 'line-clamp-2',
        )}
      >
        <FeedbackText text={answer.message} tags={answer.messageTags} />
      </Text>
      {isCutOff && (
        <TextToggle
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          className="mt-0.5 block"
        >
          {isOpen ? 'Read less' : 'Read more'}
          <span className="sr-only"> of what {writer} answered</span>
        </TextToggle>
      )}
    </>
  );
}

type AskRowProps = {
  ask: HomeFeedAsk;
  readerAccountId: string;
  /** Whether this is the Ask the card answers, whose words are already above. */
  isThisCard: boolean;
};

/**
 * One person asked: who, where they stand and, once they have answered, what they wrote. The Ask
 * this card answers is named and marked, without its words again.
 */
function AskRow({ ask, readerAccountId, isThisCard }: AskRowProps) {
  const name = feedCardGiver(ask.person, readerAccountId);

  return (
    <li>
      <AvatarName
        name={ask.person.name ?? ''}
        photoUrl={ask.person.photoUrl}
        size="sm"
        className="flex items-start"
        avatarClassName={ASK_STATUS_RINGS[ask.status]}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Text as="span" variant="subtitle-4">
            {ask.person.accountId === readerAccountId ? (
              'You'
            ) : (
              <PersonName name={name} inactive={ask.person.inactive} />
            )}
          </Text>
          <AskStatus status={ask.status} isThisCard={isThisCard} />
        </div>
        {ask.answer && !isThisCard && (
          <AskAnswer answer={ask.answer} writer={name} />
        )}
      </AvatarName>
    </li>
  );
}

export type AskedPeopleProps = {
  request: HomeFeedRequest;
  /** Who wrote this card's answer, who the card has already named. */
  giverAccountId: string;
  /** Who is reading, so a row can say "You". */
  readerAccountId: string;
};

/**
 * Everyone a request asked, at the foot of one answer to it, the writer of this card first and marked
 * as this answer, so the count and the faces add up to the whole request and the card's own place in
 * it is plain. Every card of a request shows this, so it starts closed: how they stand and a stack of
 * faces, whose press lists each name and status. On Home and in Received the reader reads every
 * answer, since each takes the request's one Visibility (brain `ADR-0050`). A Giver in Given may not,
 * so an Ask can stand answered with no words to show (ADR 0081), which is why who answered is read
 * from the status.
 *
 * Opening it reads the other answers in place: this card's writer, then the others who answered,
 * then those still waiting, three people and two lines each at first. Somebody asked alone has
 * nobody else to list, so it draws nothing, and with no other answers to read there is nothing to
 * open.
 */
export function AskedPeople({
  request,
  giverAccountId,
  readerAccountId,
}: AskedPeopleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShowingEveryone, setIsShowingEveryone] = useState(false);
  const labelId = useId();

  const thisCard = request.asked.filter(
    (ask) => ask.person.accountId === giverAccountId,
  );
  const others = request.asked.filter(
    (ask) => ask.person.accountId !== giverAccountId,
  );
  if (others.length === 0) {
    return null;
  }

  const answeredOthers = others.filter((ask) => ask.status === 'ANSWERED');
  const waiting = others.filter((ask) => ask.status !== 'ANSWERED');
  const inOrder = [...thisCard, ...answeredOthers, ...waiting];
  const answeredCount = inOrder.length - waiting.length;
  const isThisCard = (ask: HomeFeedAsk) =>
    ask.person.accountId === giverAccountId;
  const shown = isShowingEveryone ? inOrder : inOrder.slice(0, PEOPLE_AT_FIRST);
  const hiddenCount = inOrder.length - shown.length;

  return (
    <div className="flex flex-col items-start gap-3 border-border-muted border-t border-dashed pt-3">
      <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
        <Text as="p" id={labelId} variant="body-3" tone="muted">
          Asked {inOrder.length} people (
          <Standing answers={answeredCount} pending={waiting.length} />)
        </Text>
        {!isOpen && (
          <AvatarGroup
            people={inOrder.map((ask) => {
              const name = feedCardGiver(ask.person, readerAccountId);
              return {
                id: ask.person.accountId,
                name: ask.person.name ?? '',
                photoUrl: ask.person.photoUrl,
                label: ask.person.inactive ? `${name} (inactive)` : name,
                isMuted: ask.person.inactive,
                trailing: (
                  <AskStatus status={ask.status} isThisCard={isThisCard(ask)} />
                ),
                avatarClassName: ASK_STATUS_RINGS[ask.status],
              };
            })}
            max={MAX_FACES}
            size="sm"
            listTitle="Asked"
            listDescription={`${feedCardGiver(request.requester, readerAccountId)} asked each of them this question.`}
            listLabel="Show everyone asked"
          />
        )}
        {answeredOthers.some((ask) => ask.answer !== null) && (
          <TextToggle
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            className="ms-auto inline-flex items-center gap-1"
          >
            {isOpen ? 'Hide answers' : 'Show answers'}
            <ChevronDownIcon
              aria-hidden="true"
              className={cn(
                'size-4 transition-transform ease-smooth-out',
                isOpen && 'rotate-180',
              )}
            />
          </TextToggle>
        )}
      </div>
      {isOpen && (
        <>
          <ul aria-labelledby={labelId} className="flex w-full flex-col gap-3">
            {shown.map((ask) => (
              <AskRow
                key={ask.person.accountId}
                ask={ask}
                readerAccountId={readerAccountId}
                isThisCard={isThisCard(ask)}
              />
            ))}
          </ul>
          {inOrder.length > PEOPLE_AT_FIRST && (
            <TextToggle
              isOpen={isShowingEveryone}
              onToggle={() => setIsShowingEveryone(!isShowingEveryone)}
              className="mt-0.5 block"
            >
              {isShowingEveryone ? 'Show less' : `Show ${hiddenCount} more`}
            </TextToggle>
          )}
        </>
      )}
    </div>
  );
}
