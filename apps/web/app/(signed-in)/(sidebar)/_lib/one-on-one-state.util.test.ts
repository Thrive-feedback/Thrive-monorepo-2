import { describe, expect, it } from 'vitest';
import type { OneOnOne } from './one-on-one.type';
import {
  awaitsReadersAnswer,
  groupOf,
  inListOrder,
  tabOf,
} from './one-on-one-state.util';

const ME = 'account-me';
const OTHER = 'account-other';

function oneOnOne(id: string, overrides: Partial<OneOnOne>): OneOnOne {
  return {
    id,
    status: 'ACTIVE',
    startedByAccountId: ME,
    invitedAccountId: OTHER,
    withAccountId: OTHER,
    schedule: {
      cadence: 'WEEKLY',
      weekday: 4,
      templateKey: 'weekly-check-in',
      templateName: 'Weekly check-in',
      startsOn: '2026-11-26',
    },
    inviteNote: null,
    suggestedAt: null,
    answerNote: null,
    nextMeetingAt: null,
    nextMeetingSkippedAt: null,
    answeredAt: null,
    endedAt: null,
    createdAt: '2026-11-20T03:00:00.000Z',
    meetingInProgress: false,
    hasFinishedMeeting: false,
    ...overrides,
  };
}

const sentToMe = oneOnOne('sent-to-me', {
  status: 'INVITED',
  startedByAccountId: OTHER,
  invitedAccountId: ME,
});
const sentToMeLater = oneOnOne('sent-to-me-later', {
  status: 'INVITED',
  startedByAccountId: OTHER,
  invitedAccountId: ME,
  createdAt: '2026-11-21T03:00:00.000Z',
});
const myInvitation = oneOnOne('my-invitation', { status: 'INVITED' });
const soon = oneOnOne('soon', { nextMeetingAt: '2026-11-27T03:00:00.000Z' });
const later = oneOnOne('later', { nextMeetingAt: '2026-12-03T03:00:00.000Z' });
const declined = oneOnOne('declined', { status: 'DECLINED' });
const endedLongAgo = oneOnOne('ended-long-ago', {
  status: 'ENDED',
  endedAt: '2026-10-01T03:00:00.000Z',
});
const endedLately = oneOnOne('ended-lately', {
  status: 'ENDED',
  endedAt: '2026-11-25T03:00:00.000Z',
});

describe('where a 1:1 stands for its reader', () => {
  it('waits on the reader only when it was sent to them', () => {
    expect(awaitsReadersAnswer(sentToMe)).toBe(true);
    expect(awaitsReadersAnswer(myInvitation)).toBe(false);
    expect(groupOf(myInvitation)).toBe('waiting');
  });

  it('lists what needs an answer first, then what runs by its next meeting, then the rest', () => {
    expect(
      inListOrder([
        endedLongAgo,
        later,
        declined,
        myInvitation,
        endedLately,
        soon,
        sentToMeLater,
        sentToMe,
      ]).map((each) => each.id),
    ).toEqual([
      'sent-to-me',
      'sent-to-me-later',
      'soon',
      'later',
      'my-invitation',
      'declined',
      'ended-lately',
      'ended-long-ago',
    ]);
  });

  it('puts a meeting held once with what is past once it has met', () => {
    const once = {
      ...soon.schedule,
      cadence: 'ONCE' as const,
      startsOn: '2026-11-24',
    };
    const upcoming = oneOnOne('once-upcoming', {
      schedule: once,
      nextMeetingAt: '2026-12-02T04:00:00.000Z',
      nextMeetingSkippedAt: null,
    });
    const met = oneOnOne('once-met', { schedule: once, nextMeetingAt: null });

    expect(groupOf(upcoming)).toBe('running');
    expect(tabOf(upcoming)).toBe('upcoming');
    expect(groupOf(met)).toBe('past');
    expect(tabOf(met)).toBe('history');
    // Among what is past it is dated by its day, most recent first, like an ended 1:1.
    expect(
      inListOrder([endedLongAgo, met, endedLately]).map((each) => each.id),
    ).toEqual(['ended-lately', 'once-met', 'ended-long-ago']);
  });

  it('keeps a meeting held once with what runs while its meeting is in progress, past its slot', () => {
    const inProgress = oneOnOne('once-in-progress', {
      schedule: { ...soon.schedule, cadence: 'ONCE', startsOn: '2026-11-24' },
      nextMeetingAt: null,
      nextMeetingSkippedAt: null,
      meetingInProgress: true,
      hasFinishedMeeting: false,
    });

    expect(groupOf(inProgress)).toBe('running');
    expect(tabOf(inProgress)).toBe('upcoming');
  });

  it('keeps another time sent back to the reader with what needs their answer', () => {
    const suggested = oneOnOne('suggested', {
      status: 'INVITED',
      startedByAccountId: OTHER,
      invitedAccountId: ME,
      suggestedAt: '2026-11-25T08:00:00.000Z',
    });

    expect(groupOf(suggested)).toBe('answer');
    expect(tabOf(suggested)).toBe('pending');
    expect(tabOf(myInvitation)).toBe('pending');
    expect(tabOf(declined)).toBe('history');
  });
});
