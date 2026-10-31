'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Badge } from '@/components/atoms/badge';
import { link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { AvatarGroup } from '@/components/molecules/avatar-group';
import { AvatarName } from '@/components/molecules/avatar-name';
import { cn } from '@/lib/cn.util';
import {
  ASK_STATUS_NAMES,
  ASK_STATUS_TONES,
} from '@/lib/feedback/ask-status.constant';
import type {
  HomeFeedAsk,
  HomeFeedRequest,
} from '@/lib/feedback/home-feed-item.type';
import { FeedbackText } from '../feedback-text';
import { PersonName } from '../person-name';
import { feedCardGiver } from './feed-card-sentence.util';
import { useIsCutOff } from './use-is-cut-off';

/** How many people show before the rest wait behind a press, so a card stays one card's height. */
const PEOPLE_AT_FIRST = 2;

/** Past this many faces, the rest become one "+N", as everywhere a stack of faces is drawn. */
const MAX_FACES = 4;

type StandingProps = {
  answers: number;
  pending: number;
};

/** Where the others stand, in a few words: answers in green, those waiting in yellow. */
function Standing({ answers, pending }: StandingProps) {
  return (
    <>
      {answers > 0 && (
        <span className="font-medium text-status-success-active">
          {answers} {answers === 1 ? 'answer' : 'answers'}
        </span>
      )}
      {answers > 0 && pending > 0 && ', '}
      {pending > 0 && (
        <span className="font-medium text-status-warning-active">
          {pending} pending
        </span>
      )}
    </>
  );
}

/** Where one Ask stands, in the word and the colour every screen gives it. */
function AskStatusBadge({ status }: Pick<HomeFeedAsk, 'status'>) {
  return (
    <Badge tone={ASK_STATUS_TONES[status]}>{ASK_STATUS_NAMES[status]}</Badge>
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
};

/** One person asked: who, where they stand and, once they have answered, what they wrote. */
function AskRow({ ask, readerAccountId }: AskRowProps) {
  const name = feedCardGiver(ask.person, readerAccountId);

  return (
    <li>
      <AvatarName
        name={ask.person.name ?? ''}
        photoUrl={ask.person.photoUrl}
        size="sm"
        className="flex items-start"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Text as="span" variant="subtitle-4">
            {ask.person.accountId === readerAccountId ? (
              'You'
            ) : (
              <PersonName name={name} inactive={ask.person.inactive} />
            )}
          </Text>
          <AskStatusBadge status={ask.status} />
        </div>
        {ask.answer && <AskAnswer answer={ask.answer} writer={name} />}
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
 * Who else a request asked, at the foot of an answer. Every card of a request shows this, so it
 * starts closed: how they stand and a stack of faces, whose press lists each name and status. Whoever
 * reads the card reads all of it, since every answer takes the request's one Visibility (brain
 * `ADR-0050`).
 *
 * Opening it reads the answers in place: those who answered first, then those still waiting, two
 * people and two lines each at first. Somebody asked alone has nobody to list, so it draws nothing,
 * and with no answers to read there is nothing to open.
 */
export function AskedPeople({
  request,
  giverAccountId,
  readerAccountId,
}: AskedPeopleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShowingEveryone, setIsShowingEveryone] = useState(false);
  const labelId = useId();

  const others = request.asked.filter(
    (ask) => ask.person.accountId !== giverAccountId,
  );
  if (others.length === 0) {
    return null;
  }

  const answered = others.filter((ask) => ask.answer !== null);
  const waiting = others.filter((ask) => ask.answer === null);
  const inOrder = [...answered, ...waiting];
  const shown = isShowingEveryone ? inOrder : inOrder.slice(0, PEOPLE_AT_FIRST);
  const hiddenCount = inOrder.length - shown.length;

  return (
    <div className="flex flex-col items-start gap-3 border-border-muted border-t border-dashed pt-3">
      <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
        <Text as="p" id={labelId} variant="body-3" tone="muted">
          Also asked (
          <Standing answers={answered.length} pending={waiting.length} />)
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
                trailing: <AskStatusBadge status={ask.status} />,
              };
            })}
            max={MAX_FACES}
            size="sm"
            listTitle="Also asked"
            listDescription={`${feedCardGiver(request.requester, readerAccountId)} asked them the same question.`}
            listLabel="Show who else was asked"
          />
        )}
        {answered.length > 0 && (
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
