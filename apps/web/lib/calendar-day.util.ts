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

/** `en-US`, because `en-GB` writes September in four letters and a postmark has room for three. */
const MONTH = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
});

export function calendarDay(isoDateTime: string): string {
  return DAY.format(new Date(isoDateTime));
}

/** A day as a postmark prints it, on two lines: `04 OCT`, then `2026`. */
export function postmarkDay(isoDateTime: string) {
  const date = new Date(isoDateTime);
  const day = String(date.getUTCDate()).padStart(2, '0');

  return {
    dayAndMonth: `${day} ${MONTH.format(date).toUpperCase()}`,
    year: String(date.getUTCFullYear()),
  };
}
