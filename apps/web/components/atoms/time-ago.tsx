import { calendarDay } from '@/lib/calendar-day.util';
import { timeAgo } from '@/lib/time-ago.util';

export type TimeAgoProps = {
  /** When it happened, as an ISO date. */
  dateTime: string;
};

/**
 * How long ago something happened, `3 hours ago`, with the day itself on a hover. Every card on
 * the new Home says when with this. The server and the browser can read the clock either side of
 * a minute, so the browser keeps what the server wrote rather than calling that a mismatch.
 */
export function TimeAgo({ dateTime }: TimeAgoProps) {
  return (
    <time
      dateTime={dateTime}
      title={calendarDay(dateTime)}
      suppressHydrationWarning
    >
      {timeAgo(dateTime)}
    </time>
  );
}
