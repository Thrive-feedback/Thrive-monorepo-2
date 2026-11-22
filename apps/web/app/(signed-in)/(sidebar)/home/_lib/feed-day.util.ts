import type { HomeFeedEntry } from '@/lib/feedback/home-feed-item.type';
import type { HomeWeekCounts, HomeWeekSummary } from './home-week.type';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A day's name, read off its date alone. The date already sits on the API's clock (ADR 0095), so
 * these format it in UTC: in UTC, midnight of `YYYY-MM-DD` is that very date, on the server and in
 * every browser alike.
 */
const WEEKDAY = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  timeZone: 'UTC',
});
const MONTH = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  timeZone: 'UTC',
});

function midnightOf(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** The day before a `YYYY-MM-DD` day. */
export function dayBefore(day: string): string {
  return new Date(midnightOf(day).getTime() - DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** How a day is named on Home, from its date and today's, never from a clock. */
export type DayName = {
  /** `Today`, `Yesterday`, or the weekday. */
  readonly label: string;
  readonly weekday: string;
  /** The day of the month, without a leading zero. */
  readonly numeral: string;
  /** What stands under the numeral: the month inside the week, the month and year before it. */
  readonly detail: string;
};

/**
 * A day named from its date and the week's. Without a week, as when the API could not count it,
 * nothing says which day is today, so every day takes its weekday and its month and year.
 */
export function nameDay(day: string, week: HomeWeekSummary | null): DayName {
  const date = midnightOf(day);
  const weekday = WEEKDAY.format(date);
  const month = MONTH.format(date);
  const label =
    day === week?.today
      ? 'Today'
      : week && day === dayBefore(week.today)
        ? 'Yesterday'
        : weekday;
  const isInTheWeek = week?.days.some((one) => one.day === day) ?? false;
  return {
    label,
    weekday,
    numeral: String(date.getUTCDate()),
    detail: !isInTheWeek
      ? `${month} ${date.getUTCFullYear()}`
      : label === weekday
        ? month
        : `${weekday} · ${month}`,
  };
}

/** Whether a day of the week held nothing at all on the reader's Home. */
export function isQuiet(counts: HomeWeekCounts): boolean {
  return counts.offered + counts.answers + counts.kudos === 0;
}

/** One stretch of Home: a day with what was given on it, or a day of the week that held nothing. */
export type FeedDaySection =
  | {
      readonly kind: 'day';
      readonly day: string;
      readonly entries: readonly HomeFeedEntry[];
      /** How much the day held, for a day of the week; `null` before it. */
      readonly counts: HomeWeekCounts | null;
    }
  | { readonly kind: 'quiet'; readonly day: string };

/**
 * Home's list in days, newest first, in one pass over what it has read.
 *
 * A day of the week that held nothing is shown as such, but only once the list has read past it or
 * reached its end, so a quiet line never stands above cards still to come. Whether a day is quiet is
 * the API's count, never the absence of a card read so far: the first page may not reach Wednesday.
 * Something dated after today, which a clock running ahead somewhere can give, is counted as today.
 */
export function groupFeedByDay(
  entries: readonly HomeFeedEntry[],
  week: HomeWeekSummary | null,
  hasReachedEnd: boolean,
): readonly FeedDaySection[] {
  // Without a week, the days are the list's alone: no counts, and no day said to be quiet.
  const days = week?.days ?? [];
  const countsOf = new Map(days.map((one) => [one.day, one]));
  const byDay = new Map<string, HomeFeedEntry[]>();
  for (const entry of entries) {
    const day = week && entry.day > week.today ? week.today : entry.day;
    const held = byDay.get(day);
    if (held) {
      held.push(entry);
    } else {
      byDay.set(day, [entry]);
    }
  }
  const oldestRead = [...byDay.keys()].at(-1);
  const quietDays = days
    .filter(
      (one) =>
        isQuiet(one) &&
        !byDay.has(one.day) &&
        (hasReachedEnd || (oldestRead !== undefined && oldestRead < one.day)),
    )
    .map((one) => one.day);

  return [...byDay.keys(), ...quietDays]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((day): FeedDaySection => {
      const dayEntries = byDay.get(day);
      if (!dayEntries) {
        return { kind: 'quiet', day };
      }
      const counts = countsOf.get(day);
      return {
        kind: 'day',
        day,
        entries: dayEntries,
        counts: counts
          ? {
              offered: counts.offered,
              answers: counts.answers,
              kudos: counts.kudos,
            }
          : null,
      };
    });
}

/** `1 offered`, `2 answers`, `1 Kudos`: what a count reads as, each in its kind's own words. */
export function countWords(counts: HomeWeekCounts, countsKudos: boolean) {
  return [
    {
      tone: 'primary' as const,
      count: counts.offered,
      words: `${counts.offered} offered`,
    },
    {
      tone: 'tertiary' as const,
      count: counts.answers,
      words: `${counts.answers} ${counts.answers === 1 ? 'answer' : 'answers'}`,
    },
    ...(countsKudos
      ? [
          {
            tone: 'secondary' as const,
            count: counts.kudos,
            words: `${counts.kudos} Kudos`,
          },
        ]
      : []),
  ];
}
