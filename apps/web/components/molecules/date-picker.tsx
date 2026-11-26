'use client';

import { CalendarIcon } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useId, useState } from 'react';
import { Calendar } from '@/components/atoms/calendar';
import { inputVariants } from '@/components/atoms/input';
import { cn } from '@/lib/cn.util';

const SHOWN = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** "Wed, 2 Dec 2026" for a `YYYY-MM-DD` day. */
function shown(day: string): string {
  return SHOWN.format(new Date(`${day}T00:00:00.000Z`));
}

export type DatePickerProps = {
  /** The chosen day, `YYYY-MM-DD`, or `null` for none. */
  value: string | null;
  onChange: (day: string | null) => void;
  /** For a `Label`'s `htmlFor`. */
  id?: string;
  /**
   * The label's id. The field is then named by the label and the day chosen together, as "Date Wed,
   * 2 Dec 2026": a label alone would name a button over what it shows.
   */
  'aria-labelledby'?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  /** What counts as today, such as today in Bangkok. */
  today?: string;
  /** Offers Clear, for a day that may be left out. */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Choosing a day on Thrive's own calendar rather than the browser's: a field that reads like the
 * other inputs, showing the day in words, which opens the month beside it. Choosing a day closes it;
 * Today jumps to today where it may be chosen, and Clear empties a day that is optional.
 */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'Choose a day',
  min,
  max,
  today,
  clearable = false,
  disabled = false,
  'aria-labelledby': labelledBy,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const valueId = useId();
  const todayAllowed =
    today !== undefined &&
    (min === undefined || today >= min) &&
    (max === undefined || today <= max);

  function choose(day: string | null) {
    onChange(day);
    setIsOpen(false);
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
          className={cn(
            inputVariants(),
            'flex items-center justify-between gap-2 text-start',
            // Empty, it says what to do in the muted grey, not the grey of a control turned off.
            value === null && 'text-fg-muted',
            className,
          )}
        >
          <span id={valueId} className="truncate">
            {value ? shown(value) : placeholder}
          </span>
          <CalendarIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-fg-secondary"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 flex flex-col gap-3 rounded-control border border-border-muted bg-surface-raised p-4 text-fg-primary shadow-med"
        >
          <Calendar
            value={value}
            onChange={choose}
            min={min}
            max={max}
            today={today}
            autoFocus
          />
          {(clearable || todayAllowed) && (
            <div className="flex justify-between border-border-subtle border-t pt-3">
              {clearable ? (
                <button
                  type="button"
                  onClick={() => choose(null)}
                  className="rounded-element px-2 py-1 text-button-sm text-fg-secondary transition-colors duration-quick ease-smooth-out hover:bg-action-neutral-surface-hover focus-visible:outline-2 focus-visible:outline-action-primary"
                >
                  Clear
                </button>
              ) : (
                <span />
              )}
              {todayAllowed && today && (
                <button
                  type="button"
                  onClick={() => choose(today)}
                  className="rounded-element px-2 py-1 text-button-sm text-fg-accent transition-colors duration-quick ease-smooth-out hover:bg-action-primary-surface focus-visible:outline-2 focus-visible:outline-action-primary"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
