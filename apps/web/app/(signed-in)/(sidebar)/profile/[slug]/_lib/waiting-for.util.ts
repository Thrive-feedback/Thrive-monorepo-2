const DAY = 24 * 60 * 60 * 1000;

/**
 * How long an Ask has waited, in whole days: `waiting 21 days`. In days and never in weeks or
 * months, unlike `timeAgo`, because an Ask never expires and its age is the point. Under a day,
 * and for a clock a little behind the server's, it is `waiting since today`.
 *
 * `now` is a parameter so a test can hold time still.
 */
export function waitingFor(
  isoDateTime: string,
  now: number = Date.now(),
): string {
  const days = Math.floor((now - new Date(isoDateTime).getTime()) / DAY);
  if (!(days >= 1)) {
    return 'waiting since today';
  }
  return `waiting ${days} ${days === 1 ? 'day' : 'days'}`;
}
