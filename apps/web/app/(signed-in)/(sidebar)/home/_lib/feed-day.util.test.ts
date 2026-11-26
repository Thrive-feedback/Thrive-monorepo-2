import { describe, expect, it } from 'vitest';
import {
  countWords,
  dayBefore,
  groupFeedByDay,
  nameDay,
  toRibbonDay,
} from './feed-day.util';
import { offeredOn, weekEndingSunday } from './home-feed.fixture';

const sections = (
  ...args: Parameters<typeof groupFeedByDay>
): readonly string[] =>
  groupFeedByDay(...args).map((section) =>
    section.kind === 'quiet'
      ? `${section.day} quiet`
      : `${section.day} ${section.entries.map((entry) => entry.id).join(',')}`,
  );

describe('a day before another', () => {
  it('runs back across a month and a year', () => {
    expect(dayBefore('2026-12-01')).toBe('2026-11-30');
    expect(dayBefore('2027-01-01')).toBe('2026-12-31');
  });
});

describe('naming a day', () => {
  const week = weekEndingSunday();

  it('says Today and Yesterday from the week, not from a clock', () => {
    expect(nameDay('2026-11-22', week)).toEqual({
      label: 'Today',
      weekday: 'Sunday',
      numeral: '22',
      detail: 'Sunday · Nov',
    });
    expect(nameDay('2026-11-21', week).label).toBe('Yesterday');
  });

  it('names the other days of the week by weekday, under the month', () => {
    expect(nameDay('2026-11-18', week)).toEqual({
      label: 'Wednesday',
      weekday: 'Wednesday',
      numeral: '18',
      detail: 'Nov',
    });
  });

  it('gives a day before the week its month and year', () => {
    expect(nameDay('2026-11-11', week)).toEqual({
      label: 'Wednesday',
      weekday: 'Wednesday',
      numeral: '11',
      detail: 'Nov 2026',
    });
  });
});

describe('Home in days', () => {
  it('groups newest first, one section a day, a day split across pages as one', () => {
    const week = weekEndingSunday({
      '2026-11-22': { offered: 2 },
      '2026-11-20': { offered: 2 },
    });
    // The first page ended halfway through Friday; the second carried on with it.
    const read = [
      offeredOn('2026-11-22', 'a'),
      offeredOn('2026-11-22', 'b'),
      offeredOn('2026-11-20', 'c'),
      offeredOn('2026-11-20', 'd'),
    ];

    expect(sections(read, week, false)).toEqual([
      '2026-11-22 a,b',
      '2026-11-21 quiet',
      '2026-11-20 c,d',
    ]);
  });

  it('carries each day of the week its counts, and none before it', () => {
    const week = weekEndingSunday({ '2026-11-22': { offered: 1, kudos: 2 } });
    const [today, before] = groupFeedByDay(
      [offeredOn('2026-11-22', 'a'), offeredOn('2026-11-10', 'b')],
      week,
      true,
    ).filter((section) => section.kind === 'day');

    expect(today?.kind === 'day' && today.counts).toEqual({
      offered: 1,
      answers: 0,
      kudos: 2,
    });
    expect(before?.kind === 'day' && before.counts).toBeNull();
  });

  it('shows a quiet day only once the list has read past it', () => {
    const week = weekEndingSunday({
      '2026-11-22': { offered: 1 },
      '2026-11-19': { offered: 1 },
    });

    // Thursday is still to come, so the days between are not yet known to be quiet in the list.
    expect(sections([offeredOn('2026-11-22', 'a')], week, false)).toEqual([
      '2026-11-22 a',
    ]);
    expect(
      sections(
        [offeredOn('2026-11-22', 'a'), offeredOn('2026-11-19', 'b')],
        week,
        false,
      ),
    ).toEqual([
      '2026-11-22 a',
      '2026-11-21 quiet',
      '2026-11-20 quiet',
      '2026-11-19 b',
    ]);
  });

  it('shows every quiet day of the week once the list has ended', () => {
    const week = weekEndingSunday({ '2026-11-22': { offered: 1 } });

    expect(sections([offeredOn('2026-11-22', 'a')], week, true)).toEqual([
      '2026-11-22 a',
      '2026-11-21 quiet',
      '2026-11-20 quiet',
      '2026-11-19 quiet',
      '2026-11-18 quiet',
      '2026-11-17 quiet',
      '2026-11-16 quiet',
    ]);
  });

  it('never calls a day quiet that the count says held something', () => {
    // Saturday's piece is not read yet, or is out of step with the count: it is not shown as quiet.
    const week = weekEndingSunday({
      '2026-11-22': { offered: 1 },
      '2026-11-21': { offered: 1 },
    });

    expect(sections([offeredOn('2026-11-22', 'a')], week, true)).not.toContain(
      '2026-11-21 quiet',
    );
  });

  it('counts something dated after today as today', () => {
    const week = weekEndingSunday({ '2026-11-22': { offered: 2 } });

    expect(
      sections(
        [offeredOn('2026-11-23', 'ahead'), offeredOn('2026-11-22', 'a')],
        week,
        false,
      ),
    ).toEqual(['2026-11-22 ahead,a']);
  });

  it('holds nothing for an empty list that has ended but a quiet week', () => {
    expect(sections([], weekEndingSunday(), true)).toHaveLength(7);
    expect(sections([], weekEndingSunday(), false)).toEqual([]);
  });
});

describe('the words for a count', () => {
  it('says each kind in its own words, and leaves Kudos out where there are none to count', () => {
    const counts = { offered: 1, answers: 2, kudos: 1 };

    expect(countWords(counts, true).map(({ words }) => words)).toEqual([
      '1 offered',
      '2 answers',
      '1 Kudos',
    ]);
    expect(countWords(counts, false).map(({ words }) => words)).toEqual([
      '1 offered',
      '2 answers',
    ]);
  });
});

describe('Home in days without a week', () => {
  it('groups the cards by day with no counts, no quiet days and no Today', () => {
    const sections = groupFeedByDay(
      [offeredOn('2026-11-22', 'a'), offeredOn('2026-11-19', 'b')],
      null,
      true,
    );

    expect(sections.map((section) => section.kind)).toEqual(['day', 'day']);
    expect(
      sections.every(
        (section) => section.kind === 'day' && section.counts === null,
      ),
    ).toBe(true);
    expect(nameDay('2026-11-22', null)).toEqual({
      label: 'Sunday',
      weekday: 'Sunday',
      numeral: '22',
      detail: 'Nov 2026',
    });
  });
});

describe('a day as a ribbon draws it', () => {
  it('says what it held in words, with a mark for each thing up to four', () => {
    const week = weekEndingSunday({
      '2026-11-22': { offered: 2, kudos: 3 },
    });
    const today = week.days.at(-1);
    if (!today) {
      throw new Error('The week has no today.');
    }

    expect(toRibbonDay(today, week)).toMatchObject({
      date: 'Sunday 22 Nov',
      month: 'Nov',
      isToday: true,
      isQuiet: false,
      marks: ['primary', 'primary', 'secondary', 'secondary'],
      held: '2 offered, 3 Kudos',
    });
  });

  it('says a quiet day held nothing, and gives it no marks', () => {
    const week = weekEndingSunday();
    const wednesday = week.days[2];
    if (!wednesday) {
      throw new Error('The week has no Wednesday.');
    }

    expect(toRibbonDay(wednesday, week)).toMatchObject({
      date: 'Wednesday 18 Nov',
      isToday: false,
      isQuiet: true,
      marks: [],
      held: 'nothing written',
    });
  });
});
