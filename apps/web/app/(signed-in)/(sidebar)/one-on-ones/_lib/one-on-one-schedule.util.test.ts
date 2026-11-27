import { describe, expect, it } from 'vitest';
import {
  describeDay,
  describeMeeting,
  describeSchedule,
  describeScheduleShort,
} from './one-on-one-schedule.util';

const WEEKLY = {
  cadence: 'WEEKLY',
  weekday: 4,
  templateKey: 'weekly-check-in',
  templateName: 'Weekly check-in',
  startsOn: '2026-11-26',
} as const;

describe('a 1:1 schedule in words', () => {
  it('says a weekly one by its day alone, as a 1:1 keeps no time of day', () => {
    expect(describeSchedule(WEEKLY)).toBe('Weekly on Thursday');
    expect(describeScheduleShort(WEEKLY)).toBe('Thu · weekly');
  });

  it('says a monthly one by the week of the month it first met in', () => {
    expect(
      describeSchedule({
        ...WEEKLY,
        cadence: 'MONTHLY',
        weekday: 5,
        startsOn: '2026-12-11',
      }),
    ).toBe('Monthly on the second Friday');
  });

  it('says a meeting by its day on Bangkok time, whatever the browser is set to', () => {
    // 17:00 UTC on 2 Dec is midnight on 3 Dec in Bangkok, where the meeting's day starts.
    expect(describeMeeting('2026-12-02T17:00:00.000Z')).toBe('Thu 3 Dec');
  });

  it('says a calendar day as the day it names', () => {
    expect(describeDay('2026-11-26')).toBe('Thu 26 Nov');
  });
});
