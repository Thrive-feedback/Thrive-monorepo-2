'use client';

import { ClockIcon } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useId, useRef, useState } from 'react';
import { inputVariants } from '@/components/atoms/input';
import { cn } from '@/lib/cn.util';
import { timeLabel } from '@/lib/time-of-day.util';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** `09` for 9. */
function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export type TimePickerProps = {
  /** Minutes after midnight, or `null` for none chosen. */
  value: number | null;
  onChange: (minutes: number) => void;
  /** For a `Label`'s `htmlFor`. */
  id?: string;
  /**
   * The label's id. The field is then named by the label and the time chosen together, as "Time
   * 10:30": a label alone would name a button over what it shows.
   */
  'aria-labelledby'?: string;
  /** How far apart the minutes offered are; 15 offers :00, :15, :30 and :45. */
  stepMinutes?: number;
  placeholder?: string;
  disabled?: boolean;
  /** Says what the time is kept in, such as "Bangkok time", from a line under the field. */
  'aria-describedby'?: string;
  className?: string;
};

type ColumnProps = {
  label: string;
  values: readonly number[];
  chosen: number | null;
  onChoose: (value: number) => void;
};

/**
 * One column to choose from, hours or minutes: a list of buttons that scrolls on its own, the chosen
 * one filled in plum and brought into view as it opens. Up and Down move between them; Enter chooses.
 */
function Column({ label, values, chosen, onChoose }: ColumnProps) {
  const list = useRef<HTMLUListElement>(null);

  function focusAt(index: number) {
    const buttons = list.current?.querySelectorAll('button');
    const next = buttons?.[Math.max(0, Math.min(values.length - 1, index))];
    next?.focus();
    next?.scrollIntoView?.({ block: 'nearest' });
  }

  return (
    <ul
      ref={(node) => {
        list.current = node;
        // As it opens, the chosen value is in view rather than the top of the list.
        node
          ?.querySelector('[aria-pressed="true"]')
          ?.scrollIntoView?.({ block: 'center' });
      }}
      aria-label={label}
      className="flex max-h-64 w-16 flex-col gap-1 overflow-y-auto p-1"
    >
      {values.map((value, index) => {
        const isChosen = value === chosen;
        return (
          <li key={value}>
            <button
              type="button"
              aria-pressed={isChosen}
              aria-label={`${twoDigits(value)} ${label.toLowerCase()}`}
              tabIndex={isChosen || (chosen === null && index === 0) ? 0 : -1}
              onClick={() => onChoose(value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  focusAt(index + (event.key === 'ArrowDown' ? 1 : -1));
                }
              }}
              className={cn(
                'w-full rounded-element py-2 text-body-2 tabular-nums transition-colors duration-quick ease-smooth-out focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:-outline-offset-2',
                isChosen
                  ? 'bg-action-primary font-medium text-fg-on-action'
                  : 'text-fg-primary hover:bg-action-primary-surface hover:text-fg-accent',
              )}
            >
              {twoDigits(value)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Choosing a time of day on Thrive's own picker rather than the browser's: a field that reads like
 * the other inputs, which opens an hour column and a minute column beside it. Choosing the hour keeps
 * it open; choosing the minutes closes it, the time set.
 */
export function TimePicker({
  value,
  onChange,
  id,
  stepMinutes = 15,
  placeholder = 'Choose a time',
  disabled = false,
  'aria-describedby': describedBy,
  'aria-labelledby': labelledBy,
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const valueId = useId();
  const minutes = Array.from(
    { length: Math.ceil(60 / stepMinutes) },
    (_, index) => index * stepMinutes,
  );
  const hour = value === null ? null : Math.floor(value / 60);
  // A minute off the step, typed elsewhere, still shows; the column offers the steps.
  const minute = value === null ? null : value % 60;

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-describedby={describedBy}
          aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
          className={cn(
            inputVariants(),
            'flex items-center justify-between gap-2 text-start tabular-nums',
            // Empty, it says what to do in the muted grey, not the grey of a control turned off.
            value === null && 'text-fg-muted',
            className,
          )}
        >
          <span id={valueId}>
            {value === null ? placeholder : timeLabel(value)}
          </span>
          <ClockIcon
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
          onOpenAutoFocus={(event) => {
            // Focus lands on the chosen hour, where a person would start changing it.
            event.preventDefault();
            const content = event.currentTarget;
            if (content instanceof HTMLElement) {
              content
                .querySelector<HTMLButtonElement>('ul button[tabindex="0"]')
                ?.focus();
            }
          }}
          className="z-50 flex gap-1 rounded-control border border-border-muted bg-surface-raised p-2 text-fg-primary shadow-med"
        >
          <Column
            label="Hours"
            values={HOURS}
            chosen={hour}
            onChoose={(next) => onChange(next * 60 + (minute ?? 0))}
          />
          <div aria-hidden="true" className="w-px bg-border-subtle" />
          <Column
            label="Minutes"
            values={minutes}
            chosen={minute}
            onChoose={(next) => {
              onChange((hour ?? 0) * 60 + next);
              setIsOpen(false);
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
