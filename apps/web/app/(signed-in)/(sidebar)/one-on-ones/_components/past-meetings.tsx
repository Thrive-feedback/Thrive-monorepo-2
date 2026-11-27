'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from '@/app/(signed-in)/(sidebar)/_components/compose-cards';
import {
  COMPOSE_CHOICE_OUTLINES,
  type ComposeChoice,
  PERSON_COMPOSE_ACTIONS,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import type { Meeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import {
  describeMeeting,
  describeTime,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { MeetingSummary } from './meeting-summary';

export type PastMeetingsCompose = {
  readonly workspaceId: string;
  readonly teammates: readonly Teammate[];
  readonly workspaceGoals: readonly string[];
  readonly writer: PostcardWriter;
};

export type PastMeetingsProps = {
  meetings: readonly Meeting[];
  /** The other person, whom Write as Feedback and Give Kudos are for. */
  other: Teammate | undefined;
  /** What the cards need; without it, the summary is read only. */
  compose?: PastMeetingsCompose;
};

/** "16:50–17:05 · 4 discussed · 2 carried over": when it ran and what it came to. */
function metaOf(meeting: Meeting, heldAt: string | null): string {
  const discussed = meeting.topics.filter((topic) => topic.discussedAt).length;
  const carried = meeting.topics.length - discussed;
  const when =
    heldAt && meeting.finishedAt
      ? `${describeTime(heldAt)}–${describeTime(meeting.finishedAt)}`
      : heldAt
        ? describeTime(heldAt)
        : null;
  return [
    when,
    `${discussed} discussed`,
    carried > 0 ? `${carried} carried over` : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

/** The two ways to carry a meeting on to the other person, in their voices, as Teammates offers them. */
const MEETING_CHOICES = [
  'give',
  'kudos',
] as const satisfies readonly ComposeChoice[];

/**
 * The meetings a 1:1 has finished, newest first, each opening to its summary. Beside each, Give and
 * Kudos, outlined in their voices as a teammate's row offers them, open the usual cards for the other
 * person, started from that meeting; whoever writes chooses who reads it, as always (ADR-0060 §10).
 */
export function PastMeetings({ meetings, other, compose }: PastMeetingsProps) {
  const ids = useId();
  const [openId, setOpenId] = useState<string | null>(meetings[0]?.id ?? null);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [choice, setChoice] = useState<ComposeChoice>('give');
  const { openCard, cards } = useComposeCards();
  const recipients = useMemo(
    () => (other && choice !== 'kudos' ? [other.accountId] : undefined),
    [other, choice],
  );
  const write = useCallback(
    (each: ComposeChoice, day: string) => {
      const mention = each === 'kudos' && other?.slug ? `@${other.slug} ` : '';
      setChoice(each);
      setMessage(`${mention}From our 1:1 on ${day}: `);
      openCard(each);
    },
    [openCard, other],
  );

  if (meetings.length === 0) {
    return (
      <Text as="p" variant="body-2" tone="muted">
        No finished meetings yet. Each one you finish is kept here for you both.
      </Text>
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-3">
        {meetings.map((meeting) => {
          const isOpen = openId === meeting.id;
          // When it was really held, which may differ from the slot it stood for.
          const heldAt = meeting.startedAt ?? meeting.occursAt;
          return (
            <li
              key={meeting.id}
              className="rounded-control border border-border-muted"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${ids}-${meeting.id}`}
                  onClick={() => setOpenId(isOpen ? null : meeting.id)}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-control py-1 text-start focus-visible:outline-2 focus-visible:outline-action-primary"
                >
                  <span className="flex flex-col gap-0.5">
                    <Text as="span" variant="subtitle-3">
                      {heldAt ? describeMeeting(heldAt) : 'A meeting'}
                    </Text>
                    <Text
                      as="span"
                      variant="body-3"
                      tone="muted"
                      className="tabular-nums"
                    >
                      {metaOf(meeting, heldAt)}
                    </Text>
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                      'order-first size-4 shrink-0 text-fg-muted transition-transform duration-quick ease-smooth-out group-hover:text-fg-primary motion-reduce:transition-none',
                      isOpen ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                </button>
                {compose && other && heldAt && (
                  <span className="flex shrink-0 gap-2">
                    {MEETING_CHOICES.map((each) =>
                      each === 'kudos' && other.slug === null ? null : (
                        <Button
                          key={each}
                          variant={COMPOSE_CHOICE_OUTLINES[each]}
                          size="sm"
                          aria-label={`${PERSON_COMPOSE_ACTIONS[each].name(other.name)}, from the meeting on ${describeMeeting(heldAt)}`}
                          onPointerEnter={warmComposeCards}
                          onFocus={warmComposeCards}
                          onClick={() => write(each, describeMeeting(heldAt))}
                        >
                          {PERSON_COMPOSE_ACTIONS[each].word}
                        </Button>
                      ),
                    )}
                  </span>
                )}
              </div>
              {isOpen && (
                <div
                  id={`${ids}-${meeting.id}`}
                  className="flex flex-col gap-5 border-border-subtle border-t px-4 py-4"
                >
                  <MeetingSummary meeting={meeting} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {compose && (
        <ComposeCards
          cards={cards}
          workspaceId={compose.workspaceId}
          teammates={compose.teammates}
          workspaceGoals={compose.workspaceGoals}
          writer={compose.writer}
          defaultRecipientAccountIds={recipients}
          defaultMessage={message}
        />
      )}
    </>
  );
}
