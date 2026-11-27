import { describe, expect, it } from 'bun:test';
import {
  OneOnOneAlreadyOverError,
  OneOnOneAnswerNoteTooLongError,
  OneOnOneInviteNoteTooLongError,
  OneOnOneNotAwaitingAnswerError,
  OneOnOneNotInItError,
  OneOnOneNotRunningError,
  OneOnOneNotYoursToAnswerError,
  OneOnOneNotYoursToChangeError,
  OneOnOneNotYoursToWithdrawError,
  OneOnOneTimePassedError,
  OneOnOneWithYourselfError,
} from '../one-on-one.errors';
import { OneOnOneSchedule } from '../value-object/one-on-one-schedule.vo';
import { OneOnOne } from './one-on-one.entity';

const KRIT = 'account-krit';
const MINT = 'account-mint';
const LEO = 'account-leo';
const NOW = new Date('2026-11-26T03:00:00.000Z');

function scheduleOn(weekday: number) {
  return OneOnOneSchedule.plan(
    {
      cadence: 'WEEKLY',
      weekday,
      templateKey: 'weekly-check-in',
    },
    NOW,
  );
}

const SCHEDULE = scheduleOn(4);

function invited(note: string | null = null) {
  return OneOnOne.invite({
    id: 'one-on-one-1',
    workspaceId: 'workspace-acme',
    startedByAccountId: KRIT,
    invitedAccountId: MINT,
    schedule: SCHEDULE,
    note,
  });
}

describe('an invitation to a 1:1', () => {
  it('waits for the person invited, with its schedule and the note trimmed', () => {
    const snapshot = invited('  Career advice  ').snapshot();

    expect(snapshot.status).toBe('INVITED');
    expect(snapshot.startedByAccountId).toBe(KRIT);
    expect(snapshot.invitedAccountId).toBe(MINT);
    expect(snapshot.schedule).toEqual(SCHEDULE.snapshot());
    expect(snapshot.inviteNote).toBe('Career advice');
  });

  it('keeps a blank note as no note', () => {
    expect(invited('   ').snapshot().inviteNote).toBeNull();
  });

  it('refuses a note over 280 characters', () => {
    expect(() => invited('x'.repeat(281))).toThrow(
      OneOnOneInviteNoteTooLongError,
    );
  });

  it('cannot be with yourself', () => {
    expect(() =>
      OneOnOne.invite({
        id: 'one-on-one-1',
        workspaceId: 'workspace-acme',
        startedByAccountId: KRIT,
        invitedAccountId: KRIT,
        schedule: SCHEDULE,
        note: null,
      }),
    ).toThrow(OneOnOneWithYourselfError);
  });

  it('runs once the person invited accepts it', () => {
    const oneOnOne = invited();

    oneOnOne.accept(MINT, NOW);

    expect(oneOnOne.snapshot().status).toBe('ACTIVE');
    expect(oneOnOne.snapshot().answeredAt).toEqual(NOW);
  });

  it('cannot be accepted by whoever sent it', () => {
    expect(() => invited().accept(KRIT, NOW)).toThrow(
      OneOnOneNotYoursToAnswerError,
    );
  });

  it('is declined by the person invited, with a note if they like', () => {
    const oneOnOne = invited();

    oneOnOne.decline(MINT, NOW, '  On leave  ');

    expect(oneOnOne.snapshot().status).toBe('DECLINED');
    expect(oneOnOne.snapshot().answerNote).toBe('On leave');
  });

  it('cannot be declined by whoever sent it', () => {
    expect(() => invited().decline(KRIT, NOW, null)).toThrow(
      OneOnOneNotYoursToAnswerError,
    );
  });

  it('refuses a note over 280 characters when turned down', () => {
    expect(() => invited().decline(MINT, NOW, 'x'.repeat(281))).toThrow(
      OneOnOneAnswerNoteTooLongError,
    );
  });

  it('cannot be answered twice', () => {
    const oneOnOne = invited();
    oneOnOne.accept(MINT, NOW);

    expect(() => oneOnOne.decline(MINT, NOW, null)).toThrow(
      OneOnOneNotAwaitingAnswerError,
    );
  });

  it('is withdrawn only by whoever sent it', () => {
    expect(() => invited().end(MINT, NOW)).toThrow(
      OneOnOneNotYoursToWithdrawError,
    );
    const oneOnOne = invited();

    oneOnOne.end(KRIT, NOW);

    expect(oneOnOne.snapshot().status).toBe('ENDED');
  });

  it('is changed only by whoever sent it, before it is answered', () => {
    expect(() => invited().reschedule(MINT, scheduleOn(2), NOW)).toThrow(
      OneOnOneNotYoursToChangeError,
    );
    const oneOnOne = invited();

    oneOnOne.reschedule(KRIT, scheduleOn(2), NOW);

    expect(oneOnOne.snapshot().schedule.weekday).toBe(2);
  });
});

describe('a running 1:1', () => {
  function running() {
    const oneOnOne = invited();
    oneOnOne.accept(MINT, NOW);
    return oneOnOne;
  }

  it('is ended by either person', () => {
    const byInvited = running();
    byInvited.end(MINT, NOW);
    const bySender = running();
    bySender.end(KRIT, NOW);

    expect(byInvited.snapshot().status).toBe('ENDED');
    expect(bySender.snapshot().status).toBe('ENDED');
  });

  it('is not ended by somebody outside it', () => {
    expect(() => running().end(LEO, NOW)).toThrow(OneOnOneNotInItError);
  });

  it('cannot be ended twice', () => {
    const oneOnOne = running();
    oneOnOne.end(KRIT, NOW);

    expect(() => oneOnOne.end(MINT, NOW)).toThrow(OneOnOneAlreadyOverError);
  });

  it('is rescheduled by either person, at once', () => {
    const byInvited = running();
    byInvited.reschedule(MINT, scheduleOn(2), NOW);
    const bySender = running();
    bySender.reschedule(KRIT, scheduleOn(5), NOW);

    expect(byInvited.snapshot().schedule.weekday).toBe(2);
    expect(bySender.snapshot().schedule.weekday).toBe(5);
  });

  it('is not rescheduled by somebody outside it', () => {
    expect(() => running().reschedule(LEO, SCHEDULE, NOW)).toThrow(
      OneOnOneNotInItError,
    );
  });

  it('knows who is in it', () => {
    const oneOnOne = running();

    expect(oneOnOne.isIn(KRIT)).toBe(true);
    expect(oneOnOne.isIn(MINT)).toBe(true);
    expect(oneOnOne.isIn(LEO)).toBe(false);
  });
});

describe('another time suggested for an invitation', () => {
  it('sends it back to whoever sent it, with the new time and note', () => {
    const oneOnOne = invited('Career advice');
    const later = new Date('2026-11-26T05:00:00.000Z');

    oneOnOne.suggestAnother(MINT, scheduleOn(2), '  Tuesday suits me  ', later);

    const snapshot = oneOnOne.snapshot();
    expect(snapshot.status).toBe('INVITED');
    expect(snapshot.startedByAccountId).toBe(MINT);
    expect(snapshot.invitedAccountId).toBe(KRIT);
    expect(snapshot.schedule.weekday).toBe(2);
    expect(snapshot.inviteNote).toBe('Tuesday suits me');
    expect(snapshot.suggestedAt).toEqual(later);
  });

  it('can go back and forth until one of them accepts', () => {
    const oneOnOne = invited();
    oneOnOne.suggestAnother(MINT, scheduleOn(2), null, NOW);
    oneOnOne.suggestAnother(KRIT, scheduleOn(5), null, NOW);

    oneOnOne.accept(MINT, NOW);

    expect(oneOnOne.snapshot().status).toBe('ACTIVE');
    expect(oneOnOne.snapshot().schedule.weekday).toBe(5);
  });

  it('is only the person invited’s to suggest', () => {
    expect(() =>
      invited().suggestAnother(KRIT, scheduleOn(2), null, NOW),
    ).toThrow(OneOnOneNotYoursToAnswerError);
  });

  it('is refused once it was answered', () => {
    const oneOnOne = invited();
    oneOnOne.accept(MINT, NOW);

    expect(() =>
      oneOnOne.suggestAnother(MINT, scheduleOn(2), null, NOW),
    ).toThrow(OneOnOneNotAwaitingAnswerError);
  });

  it('refuses a note over 280 characters', () => {
    expect(() =>
      invited().suggestAnother(MINT, scheduleOn(2), 'x'.repeat(281), NOW),
    ).toThrow(OneOnOneInviteNoteTooLongError);
  });
});

describe('a 1:1 held just once', () => {
  // 10:00 to 10:30 Bangkok time on Wednesday 2 December 2026.
  const ONCE = OneOnOneSchedule.plan(
    {
      cadence: 'ONCE',
      weekday: 3,
      templateKey: 'weekly-check-in',
      startsOn: '2026-12-02',
    },
    NOW,
  );
  const DURING = new Date('2026-12-02T03:15:00.000Z');
  /** Midnight in Bangkok as 3 December starts: the day it met on is over. */
  const AFTER = new Date('2026-12-02T17:00:00.000Z');

  function once() {
    return OneOnOne.invite({
      id: 'one-on-one-2',
      workspaceId: 'workspace-acme',
      startedByAccountId: KRIT,
      invitedAccountId: MINT,
      schedule: ONCE,
      note: null,
    });
  }

  it('holds the two until its meeting is over, then no longer', () => {
    const oneOnOne = once();
    oneOnOne.accept(MINT, NOW);

    expect(oneOnOne.isOpenAt(DURING)).toBe(true);
    expect(oneOnOne.isOpenAt(AFTER)).toBe(false);
  });

  it('cannot be accepted once its time has passed', () => {
    expect(() => once().accept(MINT, AFTER)).toThrow(OneOnOneTimePassedError);
  });

  it('still holds the two while its meeting is started and not finished, past its slot', () => {
    const oneOnOne = once();
    oneOnOne.accept(MINT, NOW);

    expect(oneOnOne.isOpenAt(AFTER)).toBe(false);
    expect(oneOnOne.isOpenAt(AFTER, true)).toBe(true);
    // Its meeting finished, it is met before its day, so the two may start another.
    expect(oneOnOne.isOpenAt(DURING, false, true)).toBe(false);
  });

  it('holds nobody to an invitation whose time has passed, which can no longer be accepted', () => {
    const invitation = once();

    expect(invitation.isOpenAt(DURING)).toBe(true);
    expect(invitation.isOpenAt(AFTER)).toBe(false);
  });

  it('is not brought back by a new time once its time has passed, so the pair keeps one open 1:1', () => {
    const passed = once();

    // It holds nobody now, so the two may invite each other again…
    expect(passed.isOpenAt(AFTER)).toBe(false);
    // …and so it can only be declined or withdrawn, never revived beside the new one.
    expect(() => passed.suggestAnother(MINT, SCHEDULE, null, AFTER)).toThrow(
      OneOnOneTimePassedError,
    );
    expect(() => passed.reschedule(KRIT, SCHEDULE, AFTER)).toThrow(
      OneOnOneTimePassedError,
    );
    expect(() => passed.decline(MINT, AFTER, null)).not.toThrow();
  });

  it('keeps its meeting writable after the slot, but opens none then', () => {
    const oneOnOne = once();
    oneOnOne.accept(MINT, NOW);

    expect(() => oneOnOne.assertMeetingsWritable()).not.toThrow();
    expect(() => oneOnOne.assertMayOpenMeeting(DURING, false)).not.toThrow();
    expect(() => oneOnOne.assertMayOpenMeeting(DURING, true)).toThrow(
      OneOnOneNotRunningError,
    );
    expect(() => oneOnOne.assertMayOpenMeeting(AFTER, false)).toThrow(
      OneOnOneNotRunningError,
    );
  });

  it('can be cancelled before it happens, but not ended once over', () => {
    const cancelled = once();
    cancelled.accept(MINT, NOW);
    cancelled.end(KRIT, NOW);
    const met = once();
    met.accept(MINT, NOW);

    expect(cancelled.snapshot().status).toBe('ENDED');
    expect(() => met.end(KRIT, AFTER)).toThrow(OneOnOneAlreadyOverError);
    expect(() => met.reschedule(KRIT, SCHEDULE, AFTER)).toThrow(
      OneOnOneNotRunningError,
    );
  });
});
