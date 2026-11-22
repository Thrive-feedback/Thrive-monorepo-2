'use client';

import {
  countWords,
  isQuiet,
  nameDay,
} from '@/app/(signed-in)/(sidebar)/home/_lib/feed-day.util';
import { RIBBON_DAYS_ON_A_PHONE } from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { FEED_CARD_FILL } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import { useDayJump } from './home-day-jump';

/** As many marks as a day has room for; more than this still reads as a busy day. */
const MOST_MARKS = 4;

export type HomeWeekRibbonProps = {
  week: HomeWeekSummary;
};

/**
 * The last seven days in a row, today at the end, each with a mark in its kind's colour for what it
 * held. Pressing a day brings it into view in the list below, reading on until it is there; a day
 * that held nothing has nothing to bring, so it cannot be pressed. A phone has room for the last
 * five, which CSS decides, so the server and the browser draw the same row.
 */
export function HomeWeekRibbon({ week }: HomeWeekRibbonProps) {
  const { requestedDay, request } = useDayJump();
  const finding = requestedDay ? nameDay(requestedDay, week) : null;

  return (
    <nav aria-label="Jump to a day">
      <ol className="grid grid-cols-5 gap-1 md:grid-cols-7 md:gap-1.5">
        {week.days.map((one, index) => {
          const name = nameDay(one.day, week);
          const isToday = one.day === week.today;
          const quiet = isQuiet(one);
          const isFinding = requestedDay === one.day;
          const marks = countWords(one, week.countsKudos)
            .flatMap(({ tone, count }) =>
              Array.from({ length: count }, () => tone),
            )
            .slice(0, MOST_MARKS);
          const held = countWords(one, week.countsKudos)
            .filter(({ count }) => count > 0)
            .map(({ words }) => words)
            .join(', ');
          return (
            <li
              key={one.day}
              // Only the most recent days fit on a phone.
              className={cn(
                index < week.days.length - RIBBON_DAYS_ON_A_PHONE &&
                  'max-md:hidden',
              )}
            >
              <button
                type="button"
                disabled={quiet}
                aria-busy={isFinding}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${name.label} ${name.numeral}, ${quiet ? 'nothing written' : held}`}
                onClick={() => request(one.day)}
                className={cn(
                  'flex w-full cursor-pointer flex-col items-center gap-1 rounded-control border border-transparent px-1 pt-2 pb-2.5 text-fg-secondary transition-colors duration-quick disabled:cursor-default',
                  'enabled:hover:bg-surface-base/60 enabled:hover:text-fg-primary',
                  isToday &&
                    'border-action-primary/40 bg-surface-base text-action-primary-active shadow-low',
                  // Pulses only where motion is welcome; `aria-busy` says the same either way.
                  isFinding && 'motion-safe:animate-pulse',
                )}
              >
                <span className="text-label">
                  {isToday ? 'Today' : name.weekday.slice(0, 3)}
                </span>
                <span
                  className={cn(
                    'font-display text-subtitle-display-2',
                    quiet ? 'text-fg-muted' : 'text-fg-primary',
                  )}
                >
                  {name.numeral}
                </span>
                <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                  {marks.map((tone, mark) => (
                    <span
                      // The marks are drawn from counts alone; their order is their identity.
                      // biome-ignore lint/suspicious/noArrayIndexKey: see above
                      key={mark}
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
      <p className="sr-only" aria-live="polite">
        {finding ? `Finding ${finding.label}…` : ''}
      </p>
    </nav>
  );
}
