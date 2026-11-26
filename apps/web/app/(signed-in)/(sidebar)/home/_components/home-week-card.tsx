'use client';

import { cva } from 'class-variance-authority';
import { useId, useState } from 'react';
import {
  type RibbonDay,
  toRibbonDay,
} from '@/app/(signed-in)/(sidebar)/home/_lib/feed-day.util';
import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { useSectionInView } from '@/app/(signed-in)/(sidebar)/home/_lib/use-section-in-view';
import { Text } from '@/components/atoms/text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { FEED_CARD_FILL } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import { useDayJump } from './home-day-jump';
import { dayAnchorOf } from './home-feed-day';

/**
 * How a day of the small week stands, by precedence: today is today first, then a day scrolled to or
 * being found is marked, then a day that held nothing is quiet, and anything else is plain. A marked
 * quiet day is drawn as marked.
 */
type DayState = 'today' | 'todayMarked' | 'marked' | 'quiet' | 'plain';

function dayStateOf(
  { isToday, isQuiet }: RibbonDay,
  isMarked: boolean,
): DayState {
  if (isToday) {
    return isMarked ? 'todayMarked' : 'today';
  }
  if (isMarked) {
    return 'marked';
  }
  return isQuiet ? 'quiet' : 'plain';
}

/** A day's whole column, its button: as wide as the room's columns, or a share of the column's. */
const dayColumn = cva(
  'group flex flex-col items-center gap-1 rounded-control pt-1 pb-1.5',
  {
    variants: {
      fits: { room: 'w-6 lg:w-7 xl:w-8', column: 'w-full' },
      isQuiet: { true: 'cursor-default', false: 'cursor-pointer' },
    },
  },
);

/** A day's weekday initial, in the same state as its date. */
const dayInitial = cva(
  'text-caption transition-colors duration-quick ease-smooth-out',
  {
    variants: {
      state: {
        today: 'text-fg-accent',
        todayMarked: 'text-fg-accent',
        marked: 'text-fg-accent',
        quiet: 'text-fg-disabled',
        plain: 'text-fg-muted',
      },
    },
  },
);

/** A day's date, in its square, where every state of the day is drawn. */
const dayDate = cva(
  'flex size-6 items-center justify-center rounded-container font-display text-subtitle-display-4 tabular-nums transition duration-quick ease-smooth-out lg:size-7',
  {
    variants: {
      state: {
        today:
          'bg-action-primary text-fg-on-action group-hover:bg-action-primary-hover group-focus-visible:bg-action-primary-hover group-active:bg-action-primary-active',
        todayMarked:
          'bg-action-primary text-fg-on-action ring-2 ring-action-primary ring-offset-2 ring-offset-surface-base group-hover:bg-action-primary-hover group-focus-visible:bg-action-primary-hover group-active:bg-action-primary-active',
        marked:
          'bg-action-primary-surface text-fg-accent ring-2 ring-action-primary ring-inset group-hover:bg-action-primary-surface-hover group-active:bg-action-primary-surface-hover',
        quiet:
          'text-fg-disabled group-hover:bg-action-neutral-surface group-focus-visible:bg-action-neutral-surface',
        plain:
          'text-fg-primary group-hover:bg-action-primary-surface-hover group-focus-visible:bg-action-primary-surface-hover',
      },
    },
  },
);

export type WeekCardProps = {
  week: HomeWeekSummary;
  /** It can be seen, so pressed and reached by Tab. */
  isShown: boolean;
  /** It follows the day the list has scrolled to; only while it is shown, at its own width. */
  isWatching: boolean;
  /** Its days stand in a room of their own width beside the composer, or share a column's. */
  fits: 'room' | 'column';
  className: string;
};

/**
 * The small week's card. Titled quietly, so the days lead: each a column with its weekday's initial
 * over its date in the display face, as the ribbon's dates are, and a dot in each kind's colour it
 * held, or one faint dot, the empty track's fill, for a day that held nothing. Today's date is a
 * filled square in the brand's colour. The day the list has scrolled to has its date's square tinted
 * and ringed in the brand's colour, and follows the scroll; once the list is past the week, no day
 * does. A day pressed takes the ring at once, while the list is still finding it. The ribbon's own
 * live line, still on the page, says which day is being found, so this card says nothing more.
 */
export function WeekCard({
  week,
  isShown,
  isWatching,
  fits,
  className,
}: WeekCardProps) {
  const { requestedDay, request } = useDayJump();
  const titleId = useId();
  const days = week.days.map((one) => toRibbonDay(one, week));
  const inView = useSectionInView(
    days.map((one) => dayAnchorOf(one.day)),
    isWatching,
  );
  const first = days.at(0)?.month;
  const last = days.at(-1)?.month;

  return (
    <nav
      aria-labelledby={titleId}
      inert={!isShown}
      className={cn(
        'rounded-page border border-border-muted bg-surface-base shadow-med',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-baseline justify-between gap-3 px-0.5',
          fits === 'column' && 'sr-only',
        )}
      >
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
              fits={fits}
              isFinding={requestedDay === one.day}
              isInView={inView === dayAnchorOf(one.day)}
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
  fits: WeekCardProps['fits'];
  isFinding: boolean;
  /** The list has scrolled to it. */
  isInView: boolean;
  onPress: (day: string) => void;
};

/**
 * One day of the small week: the whole column is its button, taller than its date, so it is easy to
 * hit, and a tooltip says the day and what it held in full, pointed at or focused.
 *
 * Every state is drawn on the date's square alone, so states that meet never draw a box in a box.
 * Pointed at or focused, a day that can be pressed fills its square with the plum tint, its date
 * keeping its ink, with no edge; today's filled square deepens instead. Scrolled to, or being found, its square is tinted and ringed inside in Brand Plum, its date and initial in
 * Plum Ink, and pointed at it deepens; today's filled square is ringed just outside instead, clear of
 * its fill. Focus also takes the app's own ring around the column. A day that held nothing stays in
 * its place, in the disabled ink so it reads apart from one that held something, as an unavailable
 * Kudos does on a teammate's row: still reached by Tab and pointed at, its square taking the neutral
 * tint, with a tooltip saying it held nothing, and a press that brings nothing into view but that
 * reason, since a touch screen has only the press.
 */
function CalendarDay({
  one,
  fits,
  isFinding,
  isInView,
  onPress,
}: CalendarDayProps) {
  const [isTipShown, setIsTipShown] = useState(false);
  const { day, name, date, isToday, isQuiet, kinds, held } = one;
  const fullName =
    name.label === name.weekday ? date : `${name.label}, ${date}`;
  const state = dayStateOf(one, isInView || isFinding);

  return (
    <Tooltip open={isTipShown} onOpenChange={setIsTipShown}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled={isQuiet || undefined}
          aria-busy={isFinding}
          // Where the reader is outranks which day is today; the name still says "Today".
          aria-current={isInView ? 'location' : isToday ? 'date' : undefined}
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
          className={dayColumn({ fits, isQuiet })}
        >
          <span aria-hidden="true" className={dayInitial({ state })}>
            {name.weekday.slice(0, 1)}
          </span>
          <span aria-hidden="true" className={dayDate({ state })}>
            {name.numeral}
          </span>
          {/* Further from the date than the initial is, so a ringed date keeps clear of its dots. */}
          <span className="mt-1 flex h-1.5 gap-0.5" aria-hidden="true">
            {kinds.map((tone) => (
              <span
                key={tone}
                className={cn('size-1.5 rounded-full', FEED_CARD_FILL[tone])}
              />
            ))}
            {isQuiet && (
              <span className="size-1.5 rounded-full bg-surface-track" />
            )}
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
