import { Postmark } from '@/components/atoms/postmark';
import { calendarDay } from '@/lib/calendar-day.util';
import { cn } from '@/lib/cn.util';
import {
  POSTMARK_ANGLE,
  POSTMARK_PLACE,
  POSTMARK_PLACE_CLASS_NAME,
} from './postcard-postmark.constant';

export type PostcardPostmarkStillProps = {
  /** When it was sent, as an ISO date. */
  date: string;
};

/**
 * The postmark as a sent card keeps it, where the send left it. A phone's card has less room for
 * it beside the address, so it is smaller there.
 */
export function PostcardPostmarkStill({ date }: PostcardPostmarkStillProps) {
  return (
    <div
      style={{ ...POSTMARK_PLACE, rotate: `${POSTMARK_ANGLE}deg` }}
      className={cn(POSTMARK_PLACE_CLASS_NAME, 'w-32 md:w-48')}
    >
      <Postmark date={date} />
      <span className="sr-only">Posted {calendarDay(date)}</span>
    </div>
  );
}
