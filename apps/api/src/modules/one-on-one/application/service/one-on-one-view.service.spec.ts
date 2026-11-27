import { describe, expect, it } from 'bun:test';
import type { OneOnOneRow } from '../types/one-on-one.types';
import { OneOnOneViewService } from './one-on-one-view.service';

const NOW = new Date('2026-11-26T03:00:00.000Z');

const ROW: OneOnOneRow = {
  id: 'one-on-one-1',
  status: 'ACTIVE',
  startedByAccountId: 'krit',
  invitedAccountId: 'mint',
  schedule: {
    cadence: 'WEEKLY',
    weekday: 4,
    templateKey: 'weekly-check-in',
    startsOn: '2026-11-26',
  },
  inviteNote: null,
  suggestedAt: null,
  answerNote: null,
  answeredAt: NOW,
  endedAt: null,
  createdAt: NOW,
  templateName: 'Weekly check-in',
  meetingInProgress: false,
  hasFinishedMeeting: false,
  meetingInProgressFor: null,
  lastHeldFor: null,
  skippedDays: [],
};

describe('reading a 1:1 for one person in it', () => {
  const service = new OneOnOneViewService();

  it('names the other person, whichever side sent the invitation', () => {
    expect(service.toView(ROW, 'krit', NOW)?.withAccountId).toBe('mint');
    expect(service.toView(ROW, 'mint', NOW)?.withAccountId).toBe('krit');
  });

  it('says when a running one next meets, and nothing for one not running', () => {
    expect(service.toView(ROW, 'krit', NOW)?.nextMeetingAt).not.toBeNull();
    expect(
      service.toView({ ...ROW, status: 'INVITED' }, 'krit', NOW)?.nextMeetingAt,
    ).toBeNull();
  });

  it('has no next meeting once a meeting held once is a week past its day, unstarted', () => {
    const once = {
      ...ROW,
      schedule: { ...ROW.schedule, cadence: 'ONCE' as const },
    };

    // Thu 26 Nov: overdue through Wed 2 Dec, over as Thu 3 Dec starts in Bangkok.
    expect(
      service.toView(once, 'krit', new Date('2026-12-02T16:00:00.000Z'))
        ?.nextMeetingAt,
    ).not.toBeNull();
    expect(
      service.toView(once, 'krit', new Date('2026-12-02T17:00:00.000Z'))
        ?.nextMeetingAt,
    ).toBeNull();
  });

  it('says a meeting whose day passed is still the one due, and when it is skipped', () => {
    const view = service.toView(
      ROW,
      'krit',
      new Date('2026-11-27T03:00:00.000Z'),
    );

    // Thu 26 Nov, as its day starts in Bangkok; skipped as Thu 3 Dec starts.
    expect(view?.nextMeetingAt?.toISOString()).toBe('2026-11-25T17:00:00.000Z');
    expect(view?.nextMeetingSkippedAt?.toISOString()).toBe(
      '2026-12-02T17:00:00.000Z',
    );
  });

  it('has no next meeting once a meeting held once was finished, before its day as well', () => {
    const met = {
      ...ROW,
      schedule: {
        ...ROW.schedule,
        cadence: 'ONCE' as const,
        startsOn: '2026-12-03',
      },
      hasFinishedMeeting: true,
      lastHeldFor: new Date('2026-12-02T17:00:00.000Z'),
    };

    expect(service.toView(met, 'krit', NOW)?.nextMeetingAt).toBeNull();
    // A weekly one goes on after a meeting is finished.
    expect(
      service.toView(
        {
          ...ROW,
          hasFinishedMeeting: true,
          lastHeldFor: new Date('2026-11-25T17:00:00.000Z'),
        },
        'krit',
        NOW,
      )?.nextMeetingAt,
    ).not.toBeNull();
  });

  it('reads nothing for somebody outside it', () => {
    expect(service.toView(ROW, 'leo', NOW)).toBeNull();
  });
});
