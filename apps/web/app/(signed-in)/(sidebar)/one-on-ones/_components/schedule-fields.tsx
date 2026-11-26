'use client';

import { useId } from 'react';
import type {
  OneOnOneCadence,
  OneOnOneScheduleChoice,
  OneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  CADENCE_WORDS,
  CADENCES,
  LENGTHS,
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
import { Text } from '@/components/atoms/text';
import { DatePicker } from '@/components/molecules/date-picker';
import { TimePicker } from '@/components/molecules/time-picker';

export type ScheduleFieldsProps = {
  value: OneOnOneScheduleChoice;
  templates: readonly OneOnOneTemplate[];
  disabled?: boolean;
  onChange: (value: OneOnOneScheduleChoice) => void;
};

/**
 * When a 1:1 meets and what its agenda starts from: how often, which day, what time, how long, and
 * the template. A meeting held just once takes a date instead of a weekday. Times are Bangkok time,
 * which every schedule in Thrive is kept on.
 */
export function ScheduleFields({
  value,
  templates,
  disabled = false,
  onChange,
}: ScheduleFieldsProps) {
  const id = useId();
  const template = templates.find((each) => each.key === value.templateKey);

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
      <div className="flex flex-col gap-1.5">
        <Label id={`${id}-time-label`} htmlFor={`${id}-time`}>
          Time
        </Label>
        <TimePicker
          id={`${id}-time`}
          aria-labelledby={`${id}-time-label`}
          value={value.startMinute}
          disabled={disabled}
          aria-describedby={`${id}-time-zone`}
          onChange={(startMinute) => change({ startMinute })}
        />
        <Text id={`${id}-time-zone`} variant="body-3" tone="muted">
          Bangkok time
        </Text>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-length`}>Length</Label>
        <Select
          value={String(value.lengthMinutes)}
          onValueChange={(length) => change({ lengthMinutes: Number(length) })}
          disabled={disabled}
        >
          <SelectTrigger id={`${id}-length`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LENGTHS.map((length) => (
              <SelectItem key={length} value={String(length)}>
                {length} minutes
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor={`${id}-template`}>Agenda starts from</Label>
        <Select
          value={value.templateKey}
          onValueChange={(templateKey) => change({ templateKey })}
          disabled={disabled}
        >
          <SelectTrigger
            id={`${id}-template`}
            className="w-full"
            aria-describedby={`${id}-template-when`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((each) => (
              <SelectItem key={each.key} value={each.key}>
                {each.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {template && (
          <Text id={`${id}-template-when`} variant="body-3" tone="muted">
            {template.suggestedWhen}. Opens with “{template.questions[0]}”
          </Text>
        )}
      </div>
    </div>
  );
}
