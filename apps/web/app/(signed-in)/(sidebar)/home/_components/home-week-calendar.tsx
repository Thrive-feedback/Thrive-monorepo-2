'use client';

import { useId } from 'react';
import { toRibbonDay } from '@/app/(signed-in)/(sidebar)/home/_lib/feed-day.util';
import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { useIsScrolledPast } from '@/app/(signed-in)/(sidebar)/home/_lib/use-is-scrolled-past';
import { Text } from '@/components/atoms/text';
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
 * as a month's calendar is, each day a weekday's initial over its date, today a filled square in the
 * brand's colour, with a mark in its kind's colour for each thing a day held. Pressing a day does
 * what the ribbon's day does; a day that held nothing cannot be pressed. The ribbon's own live line,
 * still on the page, says which day is being found, so this card says nothing more.
 *
 * At rest it is not there and the composer keeps the column's width; it is inert while hidden, so
 * Tab never reaches it. It shows from `md` only, where the composer sticks.
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
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <Text as="p" variant="label" id={titleId}>
          Last 7 days
        </Text>
        <Text as="span" variant="caption" tone="muted">
          {first === last ? last : `${first} – ${last}`}
        </Text>
      </div>
      <ol className="grid grid-cols-7 gap-0.5">
        {days.map(({ day, name, date, isToday, isQuiet, marks, held }) => {
          const isFinding = requestedDay === day;
          return (
            <li key={day} className="flex flex-col items-center gap-1">
              <span aria-hidden="true" className="text-caption text-fg-muted">
                {name.weekday.slice(0, 1)}
              </span>
              <button
                type="button"
                disabled={isQuiet}
                aria-busy={isFinding}
                aria-current={isToday ? 'date' : undefined}
                aria-label={
                  name.label === name.weekday
                    ? `${date}, ${held}`
                    : `${name.label}, ${date}, ${held}`
                }
                onClick={() => request(day)}
                className={cn(
                  'flex size-6 cursor-pointer items-center justify-center rounded-container text-label tabular-nums transition-colors duration-quick disabled:cursor-default',
                  isToday
                    ? 'bg-action-primary text-fg-on-action enabled:hover:bg-action-primary-hover'
                    : 'text-fg-primary enabled:hover:bg-action-primary-surface disabled:text-fg-muted',
                  // Pulses only where motion is welcome; `aria-busy` says the same either way.
                  isFinding && 'motion-safe:animate-pulse',
                )}
              >
                {name.numeral}
              </button>
              <span className="flex h-1 gap-px" aria-hidden="true">
                {marks.map((tone, mark) => (
                  <span
                    // The marks are drawn from counts alone; their order is their identity.
                    // biome-ignore lint/suspicious/noArrayIndexKey: see above
                    key={mark}
                    className={cn('size-1 rounded-full', FEED_CARD_FILL[tone])}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
