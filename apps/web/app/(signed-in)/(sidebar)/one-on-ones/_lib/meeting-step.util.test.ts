import { describe, expect, it } from 'vitest';
import { type MeetingStepInput, stepOf } from './meeting-step.util';

/** The start of a `YYYY-MM-DD` day in Bangkok, as the API says a meeting's day. */
function dayStart(day: string): string {
  return new Date(
    Date.parse(`${day}T00:00:00.000Z`) - 7 * 3_600_000,
  ).toISOString();
}

/** A weekly 1:1 due Tue 1 Dec, skipped as Tue 8 Dec starts, read on Wed 2 Dec. */
const OVERDUE: MeetingStepInput = {
  meeting: null,
  nextMeetingAt: dayStart('2026-12-01'),
  nextMeetingSkippedAt: dayStart('2026-12-08'),
  carriedFromSkipped: null,
  isOnce: false,
  today: '2026-12-02',
};

describe('the step of the next meeting', () => {
  it('is overdue once its day passed unstarted, saying until when, and where the agenda goes', () => {
    expect(stepOf(OVERDUE)).toMatchObject({
      word: 'Overdue',
      when: 'Tue 1 Dec',
      body: 'You haven’t met yet. You can still start until Mon 7 Dec. After that it’s skipped.',
    });
    expect(
      stepOf({
        ...OVERDUE,
        meeting: {
          state: 'PREPARING',
          occursAt: null,
          startedAt: null,
          topicCount: 2,
        },
      }).body,
    ).toBe(
      'You haven’t met yet. You can still start until Mon 7 Dec. After that it’s skipped and the agenda moves to Tue 8 Dec.',
    );
  });

  it('is overdue for a week when held once, then History', () => {
    expect(stepOf({ ...OVERDUE, isOnce: true }).body).toBe(
      'You haven’t met yet. You can still start until Mon 7 Dec. After that it moves to History as skipped.',
    );
  });

  it('is preparing on its day and before it, carried over from a skipped day when it was', () => {
    expect(stepOf({ ...OVERDUE, today: '2026-12-01' })).toMatchObject({
      word: 'Preparing',
      when: 'Today',
      body: 'Add topics or use a template. When you meet, either of you can start.',
    });
    expect(
      stepOf({
        ...OVERDUE,
        nextMeetingAt: dayStart('2026-12-08'),
        today: '2026-12-08',
        carriedFromSkipped: '2026-12-01',
        meeting: {
          state: 'PREPARING',
          occursAt: null,
          startedAt: null,
          topicCount: 1,
        },
      }).body,
    ).toBe(
      'Carried over from Tue 1 Dec, which was skipped. When you meet, either of you can start.',
    );
  });

  it('says a meeting started late or early is the day it counts for, and one left open', () => {
    const late = stepOf({
      ...OVERDUE,
      today: '2026-12-04',
      meeting: {
        state: 'IN_PROGRESS',
        occursAt: dayStart('2026-12-01'),
        startedAt: '2026-12-04T03:00:00.000Z',
        topicCount: 1,
      },
    });
    expect(late).toMatchObject({
      word: 'In progress',
      when: 'Tue 1 Dec meeting, started Fri 4 Dec',
      leftOpen: null,
    });

    const early = stepOf({
      ...OVERDUE,
      today: '2026-12-05',
      meeting: {
        state: 'IN_PROGRESS',
        occursAt: dayStart('2026-12-08'),
        startedAt: '2026-12-05T03:00:00.000Z',
        topicCount: 0,
      },
    });
    expect(early.when).toBe('Tue 8 Dec meeting, started early');

    const leftOpen = stepOf({
      ...OVERDUE,
      today: '2026-12-06',
      meeting: {
        state: 'IN_PROGRESS',
        occursAt: dayStart('2026-12-01'),
        startedAt: '2026-12-04T03:00:00.000Z',
        topicCount: 1,
      },
    });
    expect(leftOpen.leftOpen).toBe(
      'The meeting from Tue 1 Dec is still open. Finish it to prepare the next one.',
    );
  });
});
