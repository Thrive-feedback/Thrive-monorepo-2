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
 * quietly, so the days lead: each a column with its weekday's initial over its date in the display
 * face, as the ribbon's dates are, and a dot in each kind's colour it held. Today's date is a filled
 * square in the brand's colour; the day being found is ringed in it, and pulses where motion is
 * welcome. The whole column is the button, taller than its date, so it is easy to hit. A day that
 * held nothing is greyed and cannot be pressed. The ribbon's own live line, still on the page, says
 * which day is being found, so this card says nothing more.
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
        {days.map(({ day, name, date, isToday, isQuiet, kinds, held }) => {
          const isFinding = requestedDay === day;
          return (
            <li key={day}>
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
                  'flex w-6 cursor-pointer flex-col items-center gap-1 rounded-control pt-1 pb-1.5 transition-colors duration-quick disabled:cursor-default lg:w-7 xl:w-8',
                  'enabled:active:bg-action-primary-surface-hover enabled:hover:bg-action-primary-surface',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-caption',
                    isToday ? 'text-fg-accent' : 'text-fg-muted',
                  )}
                >
                  {name.weekday.slice(0, 1)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 items-center justify-center rounded-container font-display text-subtitle-display-4 tabular-nums lg:size-7',
                    isToday
                      ? 'bg-action-primary text-fg-on-action'
                      : isQuiet
                        ? 'text-fg-muted'
                        : 'text-fg-primary',
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
                      className={cn(
                        'size-1.5 rounded-full',
                        FEED_CARD_FILL[tone],
                      )}
                    />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
