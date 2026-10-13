/**
 * A day as a person reads it — when something was sent, or when it expires: `11 Oct 2026`.
 *
 * Fixed to UTC and to one locale on purpose. The server renders these lists, so a format
 * that followed the machine's zone would disagree with the same page rendered elsewhere, and
 * a locale read from the request would make two renders of one page differ. #48 gives the app
 * Thai and English; this is the one place a date format has to change when it does.
 */
const DAY = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function calendarDay(isoDateTime: string): string {
  return DAY.format(new Date(isoDateTime));
}
