/** `09` for 9. */
function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * `10:30` for 630 minutes after midnight. A plain helper rather than part of the time picker, so a
 * server component can write a time the way the picker shows it: a client module's exports cannot be
 * called on the server.
 */
export function timeLabel(minutes: number): string {
  return `${twoDigits(Math.floor(minutes / 60))}:${twoDigits(minutes % 60)}`;
}
