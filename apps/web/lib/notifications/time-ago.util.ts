const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Largest unit first, so an hour-old thing reads as an hour rather than as sixty minutes. The
 * month and the year are the rough ones everybody uses for this: nothing here is a date
 * calculation, it is how long ago something felt.
 */
const STEPS: readonly (readonly [number, Intl.RelativeTimeFormatUnit])[] = [
  [YEAR, 'year'],
  [MONTH, 'month'],
  [WEEK, 'week'],
  [DAY, 'day'],
  [HOUR, 'hour'],
  [MINUTE, 'minute'],
];

/**
 * Fixed to one locale, as `calendarDay` is: #48 gives the app Thai and English, and this is the
 * other place a time format has to change when it does.
 */
const RELATIVE = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

/**
 * How long ago something happened, as a person would say it: `3 minutes ago`, `yesterday`,
 * `last week`. Anything under a minute — and anything stamped in the future, which a clock a
 * little ahead of the server's can produce — reads as `just now`.
 *
 * `now` is a parameter so a test can hold time still.
 */
export function timeAgo(isoDateTime: string, now: number = Date.now()): string {
  const elapsed = now - new Date(isoDateTime).getTime();
  if (Number.isNaN(elapsed)) {
    return 'just now';
  }
  for (const [size, unit] of STEPS) {
    if (elapsed >= size) {
      return RELATIVE.format(-Math.floor(elapsed / size), unit);
    }
  }
  return 'just now';
}
