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
    startMinute: 600,
    lengthMinutes: 30,
    templateKey: 'weekly-check-in',
    startsOn: '2026-11-26',
  },
  inviteNote: null,
  suggestedAt: null,
  answerNote: null,
  answeredAt: NOW,
  endedAt: null,
  createdAt: NOW,
  meetingInProgress: false,
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

    // 10:00 to 10:30 on 26 Nov, Bangkok time.
    expect(
      service.toView(once, 'krit', new Date('2026-11-26T03:15:00.000Z'))
        ?.nextMeetingAt,
    ).not.toBeNull();
    expect(
      service.toView(once, 'krit', new Date('2026-11-26T03:30:00.000Z'))
        ?.nextMeetingAt,
    ).toBeNull();
  });

  it('reads nothing for somebody outside it', () => {
    expect(service.toView(ROW, 'leo', NOW)).toBeNull();
  });
});
