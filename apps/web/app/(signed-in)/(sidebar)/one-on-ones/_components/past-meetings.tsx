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
import type {
  Meeting,
  TemplateName,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import {
  dayInBangkok,
  describeDay,
  describeMeeting,
  describeTime,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { type MeetingPeople, MeetingSummary } from './meeting-summary';

export type PastMeetingsCompose = {
  readonly workspaceId: string;
  readonly teammates: readonly Teammate[];
  readonly workspaceGoals: readonly string[];
  readonly writer: PostcardWriter;
};

export type PastMeetingsProps = {
  meetings: readonly Meeting[];
  /** The meeting days skipped, `YYYY-MM-DD`, oldest first: listed among the meetings held. */
  skippedDays?: readonly string[];
  /** What each template their topics came from is called, so each topic can say. */
  templates: readonly TemplateName[];
  people: MeetingPeople;
  /** The other person, whom Write as Feedback and Give Kudos are for. */
  other: Teammate | undefined;
  /** What the cards need; without it, the summary is read only. */
  compose?: PastMeetingsCompose;
};

/**
 * "Held late, Fri 4 Dec · 16:50–17:05 · 4 discussed · 2 carried over": when it ran, if not on the
 * day it counted for, and what it came to.
 */
function metaOf(meeting: Meeting, heldAt: string | null): string {
  const discussed = meeting.topics.filter((topic) => topic.discussedAt).length;
  const carried = meeting.topics.length - discussed;
  const when =
    heldAt && meeting.finishedAt
      ? `${describeTime(heldAt)}–${describeTime(meeting.finishedAt)}`
      : heldAt
        ? describeTime(heldAt)
        : null;
  const heldOn = heldAt ? dayInBangkok(heldAt) : null;
  const forDay = meeting.occursAt ? dayInBangkok(meeting.occursAt) : null;
  const off =
    heldAt && heldOn && forDay && heldOn !== forDay
      ? `${heldOn < forDay ? 'Held early' : 'Held late'}, ${describeMeeting(heldAt)}`
      : null;
  return [
    off,
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

/** A meeting held, or a run of days skipped in a row, as Past meetings lists them, newest first. */
type PastRow =
  | { readonly kind: 'held'; readonly day: string; readonly meeting: Meeting }
  | {
      readonly kind: 'skipped';
      readonly first: string;
      readonly last: string;
      readonly count: number;
    };

/** The meetings held and the days skipped, newest first, skips in a row as one row. */
function rowsOf(
  meetings: readonly Meeting[],
  skippedDays: readonly string[],
): PastRow[] {
  const days: (
    | { readonly kind: 'held'; readonly day: string; readonly meeting: Meeting }
    | { readonly kind: 'skipped'; readonly day: string }
  )[] = [
    ...meetings.map((meeting) => ({
      kind: 'held' as const,
      day: dayInBangkok(
        meeting.occursAt ?? meeting.startedAt ?? meeting.finishedAt ?? '',
      ),
      meeting,
    })),
    ...skippedDays.map((day) => ({ kind: 'skipped' as const, day })),
  ].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  const rows: PastRow[] = [];
  for (const each of days) {
    const previous = rows.at(-1);
    if (each.kind === 'held') {
      rows.push(each);
    } else if (previous?.kind === 'skipped') {
      rows[rows.length - 1] = {
        ...previous,
        first: each.day,
        count: previous.count + 1,
      };
    } else {
      rows.push({ kind: 'skipped', first: each.day, last: each.day, count: 1 });
    }
  }
  return rows;
}

/**
 * The meetings a 1:1 has finished, newest first, each opening to its summary, with the meeting days
 * nobody started (skipped) among them; skips in a row share one row. Beside each, Give and
 * Kudos, outlined in their voices as a teammate's row offers them, open the usual cards for the other
 * person, started from that meeting; whoever writes chooses who reads it, as always (ADR-0060 §10).
 */
export function PastMeetings({
  meetings,
  skippedDays = [],
  templates,
  people,
  other,
  compose,
}: PastMeetingsProps) {
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

  if (meetings.length === 0 && skippedDays.length === 0) {
    return (
      <Text as="p" variant="body-2" tone="muted">
        No past meetings yet. Each meeting you finish appears here for you both.
      </Text>
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-2">
        {rowsOf(meetings, skippedDays).map((row) => {
          if (row.kind === 'skipped') {
            return (
              <li
                key={`skipped-${row.first}`}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-control border border-border-subtle border-dashed px-4 py-3"
              >
                <Text as="span" variant="subtitle-3" tone="muted">
                  {row.count === 1
                    ? describeDay(row.first)
                    : `${describeDay(row.first)} – ${describeDay(row.last)}`}
                </Text>
                <Text as="span" variant="body-3" tone="warning">
                  {row.count === 1
                    ? 'Skipped'
                    : `Skipped ${row.count} meetings`}
                </Text>
              </li>
            );
          }
          const { meeting } = row;
          const isOpen = openId === meeting.id;
          // When it was really held, which may differ from the day it counted for.
          const heldAt = meeting.startedAt ?? meeting.occursAt;
          const forDay = meeting.occursAt ?? heldAt;
          return (
            <li
              key={meeting.id}
              className="rounded-control border border-border-muted"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
                {/* Each meeting is a heading, its button inside, so its topics sit one level under
                    it rather than skipping one. */}
                <h3 className="flex min-w-0 flex-1">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${ids}-${meeting.id}`}
                    onClick={() => setOpenId(isOpen ? null : meeting.id)}
                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-control py-1 text-start focus-visible:outline-2 focus-visible:outline-action-primary"
                  >
                    <span className="flex flex-col gap-0.5">
                      <Text as="span" variant="subtitle-3">
                        {forDay ? describeMeeting(forDay) : 'A meeting'}
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
                </h3>
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
                  <MeetingSummary
                    meeting={meeting}
                    people={people}
                    templates={templates}
                  />
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
