import { describe, expect, it } from 'vitest';
import {
  describeDay,
  describeMeeting,
  describeSchedule,
  describeScheduleShort,
  minuteOf,
  timeOf,
} from './one-on-one-schedule.util';

const WEEKLY = {
  cadence: 'WEEKLY',
  weekday: 4,
  startMinute: 600,
  lengthMinutes: 30,
  templateKey: 'weekly-check-in',
  templateName: 'Weekly check-in',
  startsOn: '2026-11-26',
} as const;

describe('a 1:1 schedule in words', () => {
  it('says a weekly one by its day and time', () => {
    expect(describeSchedule(WEEKLY)).toBe('Weekly on Thursday at 10:00');
    expect(describeScheduleShort(WEEKLY)).toBe('Thu 10:00 · weekly');
  });

  it('says a monthly one by the week of the month it first met in', () => {
    expect(
      describeSchedule({
        ...WEEKLY,
        cadence: 'MONTHLY',
        weekday: 5,
        startMinute: 960,
        startsOn: '2026-12-11',
      }),
    ).toBe('Monthly on the second Friday at 16:00');
  });

  it('says a meeting on Bangkok time, whatever the browser is set to', () => {
    expect(describeMeeting('2026-12-03T03:00:00.000Z')).toBe(
      'Thu 3 Dec, 10:00',
    );
  });

  it('says a calendar day as the day it names', () => {
    expect(describeDay('2026-11-26')).toBe('Thu 26 Nov');
  });

  it('turns times of day into minutes and back', () => {
    expect(timeOf(9 * 60 + 5)).toBe('09:05');
    expect(minuteOf('16:30')).toBe(990);
    expect(minuteOf('24:00')).toBeNull();
    expect(minuteOf('soon')).toBeNull();
  });
});
