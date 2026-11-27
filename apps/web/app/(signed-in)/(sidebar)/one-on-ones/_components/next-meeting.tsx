'use client';

import { PlayIcon, RefreshCwIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import { FinishMeetingDialog } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/finish-meeting-dialog';
import { MeetingAgenda } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-agenda';
import type { MeetingPeople } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';
import { UseTemplateButton } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/use-template-button';
import type { NextMeeting as NextMeetingData } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { startMeeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service';
import {
  dayInBangkok,
  describeMeeting,
  describeTime,
  todayInBangkok,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { PendingSaves } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/pending-saves';
import { useMeetingStateWatch } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-meeting-state-watch';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';

export type NextMeetingProps = {
  workspaceId: string;
  oneOnOneId: string;
  next: NextMeetingData;
  /** When the schedule says it next meets, for a meeting not started yet. */
  nextMeetingAt: string | null;
  people: MeetingPeople;
  /** The templates the meeting can use while it is prepared. */
  templates: readonly OneOnOneTemplate[];
};

/**
 * Sync: reads the page again, and says "Up to date" once it has, not when it was asked. A read that
 * failed says nothing, and the person may press it again.
 */
function useSync() {
  const router = useRouter();
  const [isSyncing, startSyncing] = useTransition();
  const asked = useRef(false);
  useEffect(() => {
    if (!isSyncing && asked.current) {
      asked.current = false;
      toast.success('Up to date');
    }
  }, [isSyncing]);
  function sync() {
    asked.current = true;
    startSyncing(() => router.refresh());
  }
  return { isSyncing, sync };
}

/**
 * The next meeting of a running 1:1, in its panel (brain ADR-0060 §5 and §6; ADR-0061, proposed).
 * Where it stands is one word at the top of its box, Preparing or In progress, beside the one thing
 * to press next.
 * Before it starts, either person prepares the agenda: it opens with what was not reached last time,
 * either may use a template for it, and the first write keeps it. Either presses Start whenever they
 * meet; then each topic takes a "discussed" tick and a note both read. Finish shows the summary to
 * check, then shares it with both.
 *
 * Start and Finish reach the other person by themselves: the page asks where the meeting stands every
 * few seconds while it is in view. Notes do not: each saves itself, and Sync reads what the other
 * person wrote. A note the other changed since it was read is refused rather than overwritten.
 */
export function NextMeeting({
  workspaceId,
  oneOnOneId,
  next,
  nextMeetingAt,
  people,
  templates,
}: NextMeetingProps) {
  const { isPending, run } = useOneOnOneAction();
  const { isSyncing, sync } = useSync();
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const [saves] = useState(() => new PendingSaves());
  const [isPreparing, startPreparing] = useTransition();
  /** The button that opened Finish, which takes focus back if it closes without finishing. */
  const opener = useRef<HTMLButtonElement | null>(null);

  /**
   * The summary to check before sharing has to show every note as written. A note saving itself does
   * not read the page again, so Finish first saves the note being typed, waits for every save to
   * land, reads the page, and only then opens the summary.
   */
  function openFinish(event: React.MouseEvent<HTMLButtonElement>) {
    opener.current = event.currentTarget;
    const typing = document.activeElement;
    if (typing instanceof HTMLTextAreaElement) {
      // Leaving the note saves it now rather than after the pause.
      typing.blur();
    }
    startPreparing(async () => {
      await saves.settle();
      startPreparing(() => {
        router.refresh();
        setIsFinishing(true);
      });
    });
  }
  const ids = useId();
  const meeting = next.meeting;
  const inProgress = meeting?.state === 'IN_PROGRESS';
  // A meeting is the whole of its day; one still open once that day is over was left open.
  const [today] = useState(() => todayInBangkok());
  const isStuck =
    inProgress &&
    meeting?.occursAt != null &&
    dayInBangkok(meeting.occursAt) < today;
  const agendaCount = meeting ? meeting.topics.length : next.carried.length;
  const discussedCount =
    meeting?.topics.filter((topic) => topic.discussedAt).length ?? 0;
  useMeetingStateWatch({
    workspaceId,
    oneOnOneId,
    meetingId: meeting?.id ?? null,
    state:
      meeting?.state === 'IN_PROGRESS' || meeting?.state === 'PREPARING'
        ? meeting.state
        : null,
    otherName: people.otherName,
    paused: isPending || isPreparing,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Side by side from `sm`, the button centred on the words; on a phone it goes under them. Flat
          on the page with a hairline while it is being prepared, as cards lie on the page; on the
          plum ground of the product while it runs, so a meeting under way is seen at a glance. */}
      <div
        className={cn(
          'flex flex-col items-start gap-3 rounded-control border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
          inProgress
            ? 'border-action-primary-border bg-action-primary/8'
            : 'border-border-muted bg-surface-base',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Where it stands, said as a word in the product's plum, then when. */}
          <Text as="p" variant="subtitle-3" className="tabular-nums">
            <span className="font-medium text-fg-accent">
              {inProgress ? 'In progress' : 'Preparing'}
            </span>
            <span aria-hidden="true" className="text-fg-muted">
              {' · '}
            </span>
            <span className="sr-only">, </span>
            {inProgress && meeting?.startedAt
              ? `since ${describeTime(meeting.startedAt)}`
              : nextMeetingAt
                ? describeMeeting(nextMeetingAt)
                : 'no time set'}
          </Text>
          <Text as="p" variant="body-3" tone="muted" className="max-w-prose">
            {inProgress
              ? `Tick each topic as you talk about it and note what you agreed. Finish shares the summary with you and ${people.otherName}.`
              : meeting
                ? `The agenda is saved. When you meet, either of you presses Start.`
                : `Add what you'd like to talk about, use a template, or reorder what's here. When you meet, either of you presses Start.`}
          </Text>
        </div>
        {inProgress ? (
          <Button
            variant="primary"
            disabled={isPending}
            loading={isPreparing}
            onClick={openFinish}
          >
            Finish
          </Button>
        ) : (
          <Button
            variant="primary"
            loading={isPending}
            prefixIcon={<PlayIcon aria-hidden="true" className="size-4" />}
            onClick={() =>
              run(() =>
                startMeeting(workspaceId, oneOnOneId, meeting?.id ?? null),
              )
            }
          >
            Start meeting
          </Button>
        )}
      </div>

      {isStuck && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-status-warning-surface px-4 py-3"
        >
          <Text as="p" variant="body-2">
            This meeting is still open. Finish it to start the next one.
          </Text>
          <Button
            variant="secondary"
            size="sm"
            loading={isPreparing}
            onClick={openFinish}
          >
            Finish now
          </Button>
        </div>
      )}

      <section
        aria-labelledby={`${ids}-agenda`}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-3">
          <Text as="h3" id={`${ids}-agenda`} variant="subtitle-4">
            Agenda{' '}
            <span className="font-normal text-body-3 text-fg-muted tabular-nums">
              {inProgress
                ? `${discussedCount} of ${agendaCount} discussed`
                : `${agendaCount} ${agendaCount === 1 ? 'topic' : 'topics'}`}
            </span>
          </Text>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              loading={isSyncing}
              prefixIcon={
                <RefreshCwIcon aria-hidden="true" className="size-3.5" />
              }
              onClick={sync}
              aria-label={`Sync with ${people.otherName}`}
            >
              Sync
            </Button>
            {!inProgress && (
              <UseTemplateButton
                workspaceId={workspaceId}
                oneOnOneId={oneOnOneId}
                meetingId={meeting?.id ?? null}
                templates={templates}
                current={
                  meeting?.templateKey && next.templateName
                    ? { key: meeting.templateKey, name: next.templateName }
                    : null
                }
              />
            )}
          </div>
        </div>
        <MeetingAgenda
          workspaceId={workspaceId}
          oneOnOneId={oneOnOneId}
          next={next}
          people={people}
          headingId={`${ids}-agenda`}
          track={saves.track}
        />
      </section>

      {meeting && inProgress && (
        <FinishMeetingDialog
          open={isFinishing}
          onOpenChange={setIsFinishing}
          workspaceId={workspaceId}
          oneOnOneId={oneOnOneId}
          meeting={meeting}
          returnFocusTo={() => opener.current}
        />
      )}
    </div>
  );
}
