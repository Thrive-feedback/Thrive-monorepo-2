import { Badge, type BadgeTone } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';

export type CardStampProps = {
  /** What kind of thing the card is, in one or two words. */
  label: string;
  tone: BadgeTone;
  /** When it happened, as an ISO date. */
  dateTime: string;
};

/**
 * A card's top-right corner: what kind of thing it is, as a badge, over the day it happened.
 * Right-aligned and never wrapped, so the line beside it takes the width that is left.
 */
export function CardStamp({ label, tone, dateTime }: CardStampProps) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <Badge tone={tone}>{label}</Badge>
      <Text as="p" variant="body-3" tone="muted" className="whitespace-nowrap">
        <time dateTime={dateTime}>{calendarDay(dateTime)}</time>
      </Text>
    </div>
  );
}
