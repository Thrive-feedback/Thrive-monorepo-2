'use client';

import { useId } from 'react';
import type {
  OneOnOneCadence,
  OneOnOneScheduleChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  CADENCE_WORDS,
  CADENCES,
  nextDayOn,
  todayInBangkok,
  WEEKDAYS,
  weekdayOfDay,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { Label } from '@/components/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { DatePicker } from '@/components/molecules/date-picker';

export type ScheduleFieldsProps = {
  value: OneOnOneScheduleChoice;
  disabled?: boolean;
  onChange: (value: OneOnOneScheduleChoice) => void;
};

/**
 * When a 1:1 meets: how often, and on which day. A meeting held just once takes a date instead of a
 * weekday. A 1:1 is kept by the day, with no time of day: a meeting is that whole day.
 */
export function ScheduleFields({
  value,
  disabled = false,
  onChange,
}: ScheduleFieldsProps) {
  const id = useId();

  const isOnce = value.cadence === 'ONCE';
  const today = todayInBangkok();

  function change(patch: Partial<OneOnOneScheduleChoice>) {
    onChange({ ...value, ...patch });
  }

  /** Just once takes the next day on the weekday already chosen; a repeat keeps the weekday. */
  function changeCadence(cadence: OneOnOneCadence) {
    if (cadence === 'ONCE') {
      const startsOn = value.startsOn ?? nextDayOn(value.weekday, today);
      onChange({ ...value, cadence, startsOn });
      return;
    }
    const { startsOn: _day, ...repeating } = value;
    onChange({ ...repeating, cadence });
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-cadence`}>How often</Label>
        <Select
          value={value.cadence}
          onValueChange={(next) => {
            const cadence = CADENCES.find((each) => each === next);
            if (cadence) {
              changeCadence(cadence);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger id={`${id}-cadence`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CADENCES.map((cadence) => (
              <SelectItem key={cadence} value={cadence}>
                {CADENCE_WORDS[cadence]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isOnce ? (
        <div className="flex flex-col gap-1.5">
          <Label id={`${id}-date-label`} htmlFor={`${id}-date`}>
            Date
          </Label>
          <DatePicker
            id={`${id}-date`}
            aria-labelledby={`${id}-date-label`}
            value={value.startsOn ?? null}
            min={today}
            today={today}
            disabled={disabled}
            onChange={(startsOn) => {
              if (startsOn !== null) {
                change({ startsOn, weekday: weekdayOfDay(startsOn) });
              }
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-weekday`}>Day</Label>
          <Select
            value={String(value.weekday)}
            onValueChange={(weekday) => change({ weekday: Number(weekday) })}
            disabled={disabled}
          >
            <SelectTrigger id={`${id}-weekday`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((weekday) => (
                <SelectItem key={weekday.value} value={String(weekday.value)}>
                  {weekday.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
