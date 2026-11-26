'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn.util';

/**
 * Calendar days are `YYYY-MM-DD` strings and are counted at midnight UTC, so a day is a day wherever
 * the browser is: no time zone moves a date across midnight.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

function toTime(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}

function toDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

function addDays(day: string, days: number): string {
  return toDay(toTime(day) + days * DAY_MS);
}

/** The same day of another month, held to the last day of a shorter one. */
function addMonths(day: string, months: number): string {
  const date = new Date(toTime(day));
  const wanted = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(wanted, last));
  return toDay(date.getTime());
}

/** 0 for Monday through 6 for Sunday: weeks start on Monday, as the 1:1 schedules count them. */
function weekdayIndex(day: string): number {
  return (new Date(toTime(day)).getUTCDay() + 6) % 7;
}

function firstOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** The six weeks that show a month, Monday to Sunday, padded with the days around it. */
function weeksOf(month: string): string[][] {
  const start = addDays(month, -weekdayIndex(month));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

/** The browser's own today, for when the caller names none. */
function localToday(): string {
  const now = new Date();
  return toDay(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

const MONTH = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

const FULL_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const WEEKDAY_NAMES = [
  ['M', 'Monday'],
  ['T', 'Tuesday'],
  ['W', 'Wednesday'],
  ['T', 'Thursday'],
  ['F', 'Friday'],
  ['S', 'Saturday'],
  ['S', 'Sunday'],
] as const;

export type CalendarProps = {
  /** The chosen day, `YYYY-MM-DD`, or `null` for none. */
  value: string | null;
  onChange: (day: string) => void;
  /** The first day that may be chosen; earlier ones show but cannot be. */
  min?: string;
  /** The last day that may be chosen. */
  max?: string;
  /** What counts as today, such as today in Bangkok; the browser's own day when not given. */
  today?: string;
  /** Focus the chosen day, or today, when it first draws, as it does inside a picker. */
  autoFocus?: boolean;
  className?: string;
};

/**
 * One month to choose a day from, Monday first, in the product's plum: the chosen day filled, today
 * ringed, days before `min` or after `max` there but faint.
 *
 * It is a table of day buttons, named by its month, that the keyboard moves through as people
 * expect: the arrows by a day and a week, Home and End to the week's ends, Page Up and Page Down by a
 * month, Enter or Space to choose. Only the focused day is a tab stop, so the month is one stop on
 * the way through a form.
 */
export function Calendar({
  value,
  onChange,
  min,
  max,
  today: givenToday,
  autoFocus = false,
  className,
}: CalendarProps) {
  const today = givenToday ?? localToday();
  const [focused, setFocused] = useState(() => {
    const start = value ?? today;
    if (min !== undefined && start < min) {
      return min;
    }
    return max !== undefined && start > max ? max : start;
  });
  const [hasMoved, setHasMoved] = useState(autoFocus);
  const month = firstOfMonth(focused);
  const titleId = useId();
  const grid = useRef<HTMLTableElement>(null);

  // The focused day follows the keyboard; focus itself moves only once the person has moved it.
  useEffect(() => {
    if (!hasMoved) {
      return;
    }
    grid.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)
      ?.focus();
  }, [focused, hasMoved]);

  function isOutside(day: string): boolean {
    return (min !== undefined && day < min) || (max !== undefined && day > max);
  }

  /**
   * The nearest day that may be chosen, so the day holding the month's one tab stop is never a
   * disabled one, which Tab would skip, taking the whole month with it.
   */
  function clamp(day: string): string {
    if (min !== undefined && day < min) {
      return min;
    }
    return max !== undefined && day > max ? max : day;
  }

  function move(next: string) {
    setHasMoved(true);
    setFocused(clamp(next));
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -weekdayIndex(focused)),
      End: () => addDays(focused, 6 - weekdayIndex(focused)),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    const next = moves[event.key];
    if (next) {
      event.preventDefault();
      move(next());
    }
  }

  const nextMonth = addMonths(month, 1);

  return (
    <div className={cn('flex w-72 flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2
          id={titleId}
          aria-live="polite"
          className="ps-1 text-fg-primary text-subtitle-4"
        >
          {MONTH.format(new Date(toTime(month)))}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={min !== undefined && addDays(month, -1) < min}
            onClick={() => setFocused(clamp(addMonths(focused, -1)))}
            className="grid size-8 place-content-center rounded-full text-fg-secondary transition-colors duration-quick ease-smooth-out hover:bg-action-primary-surface hover:text-fg-accent focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={max !== undefined && nextMonth > max}
            onClick={() => setFocused(clamp(addMonths(focused, 1)))}
            className="grid size-8 place-content-center rounded-full text-fg-secondary transition-colors duration-quick ease-smooth-out hover:bg-action-primary-surface hover:text-fg-accent focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent"
          >
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <table
        ref={grid}
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="w-full border-separate border-spacing-y-1"
      >
        <thead>
          <tr>
            {WEEKDAY_NAMES.map(([short, name]) => (
              <th
                key={name}
                scope="col"
                abbr={name}
                className="h-8 font-normal text-caption text-fg-muted"
              >
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeksOf(month).map((week) => (
            <tr key={week[0]}>
              {week.map((day) => {
                const isChosen = day === value;
                const isToday = day === today;
                const inMonth = day.slice(0, 7) === month.slice(0, 7);
                const isDisabled = isOutside(day);
                return (
                  <td key={day} className="p-0">
                    <button
                      type="button"
                      data-day={day}
                      tabIndex={day === focused ? 0 : -1}
                      disabled={isDisabled}
                      aria-label={FULL_DAY.format(new Date(toTime(day)))}
                      aria-current={isToday ? 'date' : undefined}
                      aria-pressed={isChosen}
                      onClick={() => {
                        setFocused(day);
                        onChange(day);
                      }}
                      onFocus={() => setFocused(day)}
                      className={cn(
                        'mx-auto grid size-9 place-content-center rounded-full text-body-2 tabular-nums transition-colors duration-quick ease-smooth-out focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2',
                        isChosen
                          ? 'bg-action-primary font-medium text-fg-on-action'
                          : isDisabled
                            ? 'cursor-not-allowed text-fg-disabled'
                            : cn(
                                'hover:bg-action-primary-surface hover:text-fg-accent',
                                inMonth ? 'text-fg-primary' : 'text-fg-muted',
                              ),
                        isToday &&
                          !isChosen &&
                          'border border-action-primary-border font-medium',
                      )}
                    >
                      {Number(day.slice(8, 10))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
