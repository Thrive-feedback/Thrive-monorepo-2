'use client';

import { useId, useState } from 'react';
import {
  type RibbonDay,
  toRibbonDay,
} from '@/app/(signed-in)/(sidebar)/home/_lib/feed-day.util';
import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { useIsScrolledPast } from '@/app/(signed-in)/(sidebar)/home/_lib/use-is-scrolled-past';
import { Text } from '@/components/atoms/text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { FEED_CARD_FILL } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import { useDayJump } from './home-day-jump';

export type HomeWeekCalendarProps = {
  week: HomeWeekSummary;
  /** The line that leaves the window as the composer sticks: the card shows only once it has. */
  stuckMarkId: string;
};

/**
 * The week's ribbon made small, a card beside the composer once the composer has stuck and the band
 * has scrolled away with the ribbon, so a day can still be reached from anywhere in the list. Titled
 * quietly, so the days lead: each a column with its weekday's initial over its date in the display
 * face, as the ribbon's dates are, and a dot in each kind's colour it held. Today's date is a filled
 * square in the brand's colour; the day being found is ringed in it, and pulses where motion is
 * welcome. The ribbon's own live line, still on the page, says which day is being found, so this
 * card says nothing more.
 *
 * At rest it is not there and the composer keeps the column's width; it is inert while hidden, so
 * Tab never reaches it. It shows from `md` only, where the composer sticks, its columns widening as
 * the page does.
 */
export function HomeWeekCalendar({ week, stuckMarkId }: HomeWeekCalendarProps) {
  const isStuck = useIsScrolledPast(stuckMarkId);
  const { requestedDay, request } = useDayJump();
  const titleId = useId();
  const days = week.days.map((one) => toRibbonDay(one, week));
  const first = days.at(0)?.month;
  const last = days.at(-1)?.month;

  return (
    <nav
      aria-labelledby={titleId}
      inert={!isStuck}
      className={cn(
        'hidden shrink-0 flex-col justify-between gap-3 rounded-page border border-border-muted bg-surface-base px-3 py-5 shadow-med',
        isStuck && 'motion-safe:animate-enter md:flex',
      )}
    >
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <Text as="p" variant="label" tone="muted" id={titleId}>
          Last 7 days
        </Text>
        <Text as="span" variant="caption" tone="muted">
          {first === last ? last : `${first} – ${last}`}
        </Text>
      </div>
      <ol className="grid grid-cols-7 gap-0.5">
        {days.map((one) => (
          <li key={one.day}>
            <CalendarDay
              one={one}
              isFinding={requestedDay === one.day}
              onPress={request}
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}

type CalendarDayProps = {
  one: RibbonDay;
  isFinding: boolean;
  onPress: (day: string) => void;
};

/**
 * One day of the small week: the whole column is its button, taller than its date, so it is easy to
 * hit, and a tooltip says the day and what it held in full, pointed at or focused.
 *
 * Pointed at or focused, a day that can be pressed lays the plum tint and a plum hairline over its
 * column and turns its date to Plum Ink; today's filled square deepens instead. Pressing deepens
 * the tint. A day that held nothing stays in its place, greyed, as an unavailable Kudos does on a
 * teammate's row: still reached by Tab and pointed at, with a neutral tint and a tooltip saying it
 * held nothing, and a press that brings nothing into view but that reason, since a touch screen has
 * only the press.
 */
function CalendarDay({ one, isFinding, onPress }: CalendarDayProps) {
  const [isTipShown, setIsTipShown] = useState(false);
  const { day, name, date, isToday, isQuiet, kinds, held } = one;
  const fullName =
    name.label === name.weekday ? date : `${name.label}, ${date}`;

  return (
    <Tooltip open={isTipShown} onOpenChange={setIsTipShown}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled={isQuiet || undefined}
          aria-busy={isFinding}
          aria-current={isToday ? 'date' : undefined}
          aria-label={`${fullName}, ${held}`}
          onClick={(event) => {
            if (isQuiet) {
              // The trigger closes its tooltip on a press unless told not to; this press shows it.
              event.preventDefault();
              setIsTipShown(true);
              return;
            }
            onPress(day);
          }}
          className={cn(
            'group flex w-6 flex-col items-center gap-1 rounded-control border border-transparent pt-1 pb-1.5 transition-colors lg:w-7 xl:w-8',
            isQuiet
              ? 'cursor-default hover:bg-action-neutral-surface focus-visible:bg-action-neutral-surface'
              : 'cursor-pointer hover:border-action-primary-border hover:bg-action-primary-surface focus-visible:border-action-primary-border focus-visible:bg-action-primary-surface active:bg-action-primary-surface-hover',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'text-caption transition-colors',
              isToday
                ? 'text-fg-accent'
                : isQuiet
                  ? 'text-fg-muted'
                  : 'text-fg-muted group-hover:text-fg-accent group-focus-visible:text-fg-accent',
            )}
          >
            {name.weekday.slice(0, 1)}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'flex size-6 items-center justify-center rounded-container font-display text-subtitle-display-4 tabular-nums transition-colors lg:size-7',
              isToday
                ? 'bg-action-primary text-fg-on-action group-hover:bg-action-primary-hover group-focus-visible:bg-action-primary-hover group-active:bg-action-primary-active'
                : isQuiet
                  ? 'text-fg-muted'
                  : 'text-fg-primary group-hover:text-fg-accent group-focus-visible:text-fg-accent',
              // Said by `aria-busy` too; the ring holds still where motion is not welcome.
              isFinding &&
                'outline-2 outline-action-primary outline-offset-1 motion-safe:animate-pulse',
            )}
          >
            {name.numeral}
          </span>
          <span className="flex h-1.5 gap-0.5" aria-hidden="true">
            {kinds.map((tone) => (
              <span
                key={tone}
                className={cn('size-1.5 rounded-full', FEED_CARD_FILL[tone])}
              />
            ))}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {isQuiet
          ? `Nothing written on ${name.weekday}`
          : `${fullName} · ${held}`}
      </TooltipContent>
    </Tooltip>
  );
}
