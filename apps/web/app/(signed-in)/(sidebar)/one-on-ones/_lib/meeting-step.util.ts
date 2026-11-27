import {
  dayInBangkok,
  describeDay,
  describeMeeting,
  describeTime,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';

const MS_IN_A_DAY = 86_400_000;

export type MeetingStepInput = {
  /** The meeting written to, if anybody has: started, or being prepared. */
  readonly meeting: {
    readonly state: 'PREPARING' | 'IN_PROGRESS' | 'FINISHED';
    readonly occursAt: string | null;
    readonly startedAt: string | null;
    readonly topicCount: number;
  } | null;
  /** The start of the day the meeting due is on: before today while it is overdue. */
  readonly nextMeetingAt: string | null;
  /** When the meeting due is skipped if nobody starts it. */
  readonly nextMeetingSkippedAt: string | null;
  /** The meeting day skipped since the agenda was written, `YYYY-MM-DD`. */
  readonly carriedFromSkipped: string | null;
  readonly isOnce: boolean;
  /** Today on the schedule's clock, `YYYY-MM-DD`. */
  readonly today: string;
};

export type MeetingStep = {
  readonly word: 'Preparing' | 'Overdue' | 'In progress';
  readonly when: string;
  readonly body: string;
  /** A meeting started before today and not finished: left open. */
  readonly leftOpen: string | null;
};

/**
 * Where the next meeting stands, as its step says it (the agreed wording): preparing, overdue (its
 * day passed and nobody started it), or in progress, with when, and the sentence under it.
 */
export function stepOf({
  meeting,
  nextMeetingAt,
  nextMeetingSkippedAt,
  carriedFromSkipped,
  isOnce,
  today,
}: MeetingStepInput): MeetingStep {
  if (meeting?.state === 'IN_PROGRESS' && meeting.startedAt) {
    const startedOn = dayInBangkok(meeting.startedAt);
    const forDay = meeting.occursAt
      ? dayInBangkok(meeting.occursAt)
      : startedOn;
    const forLabel = meeting.occursAt
      ? describeMeeting(meeting.occursAt)
      : describeMeeting(meeting.startedAt);
    const when =
      startedOn === forDay
        ? `since ${describeTime(meeting.startedAt)}`
        : startedOn < forDay
          ? `${forLabel} meeting, started early`
          : `${forLabel} meeting, started ${describeMeeting(meeting.startedAt)}`;
    return {
      word: 'In progress',
      when,
      body: 'Tick topics as you cover them and note what you agree. Finishing shares the summary with you both.',
      leftOpen:
        startedOn < today
          ? `The meeting from ${forLabel} is still open. Finish it to prepare the next one.`
          : null,
    };
  }
  const hasAgenda = (meeting?.topicCount ?? 0) > 0;
  if (nextMeetingAt && dayInBangkok(nextMeetingAt) < today) {
    const skipsAt = nextMeetingSkippedAt
      ? Date.parse(nextMeetingSkippedAt)
      : null;
    const lastDay =
      skipsAt === null
        ? null
        : describeMeeting(new Date(skipsAt - MS_IN_A_DAY).toISOString());
    const until = lastDay ? ` You can still start until ${lastDay}.` : '';
    const after = isOnce
      ? ' After that it moves to History as skipped.'
      : hasAgenda && skipsAt !== null
        ? ` After that it’s skipped and the agenda moves to ${describeMeeting(new Date(skipsAt).toISOString())}.`
        : ' After that it’s skipped.';
    return {
      word: 'Overdue',
      when: describeMeeting(nextMeetingAt),
      body: `You haven’t met yet.${until}${after}`,
      leftOpen: null,
    };
  }
  const when = nextMeetingAt
    ? dayInBangkok(nextMeetingAt) === today
      ? 'Today'
      : describeMeeting(nextMeetingAt)
    : 'no day set';
  const body = carriedFromSkipped
    ? `Carried over from ${describeDay(carriedFromSkipped)}, which was skipped. When you meet, either of you can start.`
    : meeting
      ? 'Agenda saved. When you meet, either of you can start.'
      : 'Add topics or use a template. When you meet, either of you can start.';
  return { word: 'Preparing', when, body, leftOpen: null };
}
