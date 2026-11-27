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

  it('has no next meeting once a meeting held once is over', () => {
    const once = {
      ...ROW,
      schedule: { ...ROW.schedule, cadence: 'ONCE' as const },
    };

    // All of 26 Nov, Bangkok time: over at midnight.
    expect(
      service.toView(once, 'krit', new Date('2026-11-26T03:15:00.000Z'))
        ?.nextMeetingAt,
    ).not.toBeNull();
    expect(
      service.toView(once, 'krit', new Date('2026-11-26T17:00:00.000Z'))
        ?.nextMeetingAt,
    ).toBeNull();
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
    };

    expect(service.toView(met, 'krit', NOW)?.nextMeetingAt).toBeNull();
    // A weekly one goes on after a meeting is finished.
    expect(
      service.toView({ ...ROW, hasFinishedMeeting: true }, 'krit', NOW)
        ?.nextMeetingAt,
    ).not.toBeNull();
  });

  it('reads nothing for somebody outside it', () => {
    expect(service.toView(ROW, 'leo', NOW)).toBeNull();
  });
});
