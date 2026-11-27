import type { components } from '@repo/api';

/** A 1:1's next meeting as the API answers it: the live one, or what it will open with. */
export type NextMeeting =
  components['schemas']['NextMeetingResponseDto_Output'];

/** One meeting of a 1:1: its topics and the note both write on each. */
export type Meeting = NonNullable<NextMeeting['meeting']>;

export type MeetingTopic = Meeting['topics'][number];

/**
 * What the 1:1s page reads for a running 1:1's panel: the next meeting, those finished, and the
 * meeting days skipped (`YYYY-MM-DD`, oldest first).
 */
export type OneOnOneMeetings = {
  readonly next: NextMeeting;
  readonly past: readonly Meeting[];
  readonly skippedDays: readonly string[];
};
