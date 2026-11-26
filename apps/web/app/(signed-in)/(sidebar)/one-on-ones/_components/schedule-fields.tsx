'use client';

import { useId } from 'react';
import type {
  OneOnOneCadence,
  OneOnOneScheduleChoice,
  OneOnOneTemplate,
  OneOnOneTemplateScope,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Text } from '@/components/atoms/text';
import { DatePicker } from '@/components/molecules/date-picker';
import { TimePicker } from '@/components/molecules/time-picker';

export type ScheduleFieldsProps = {
  value: OneOnOneScheduleChoice;
  templates: readonly OneOnOneTemplate[];
  /**
   * The template the 1:1 already starts from. When the person's list does not hold it, as the other
   * person's own or one since removed, it stays a choice, so changing the time never changes it.
   */
  currentTemplate?: { readonly key: string; readonly name: string };
  disabled?: boolean;
  onChange: (value: OneOnOneScheduleChoice) => void;
};

/** The layers a template comes from, in the order they are offered. */
const LAYERS: readonly { scope: OneOnOneTemplateScope; label: string }[] = [
  { scope: 'THRIVE', label: 'Thrive' },
  { scope: 'WORKSPACE', label: 'Your Workspace' },
  { scope: 'PERSONAL', label: 'Yours' },
];

/** "After each sprint. Opens with “What slowed us?”", or just the question when it says no when. */
function templateHint(template: OneOnOneTemplate): string {
  const opens = `Opens with “${template.questions[0] ?? ''}”`;
  return template.suggestedWhen ? `${template.suggestedWhen}. ${opens}` : opens;
}

/**
 * When a 1:1 meets and what its agenda starts from: how often, which day, what time, how long, and
 * the template. A meeting held just once takes a date instead of a weekday. Times are Bangkok time,
 * which every schedule in Thrive is kept on.
 */
export function ScheduleFields({
  value,
  templates,
  currentTemplate,
  disabled = false,
  onChange,
}: ScheduleFieldsProps) {
  const id = useId();
  const template = templates.find((each) => each.key === value.templateKey);
  const unlisted =
    currentTemplate &&
    !templates.some((each) => each.key === currentTemplate.key)
      ? currentTemplate
      : undefined;

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
            {unlisted && (
              <SelectGroup>
                <SelectLabel>As it is now</SelectLabel>
                <SelectItem value={unlisted.key}>{unlisted.name}</SelectItem>
              </SelectGroup>
            )}
            {LAYERS.map((layer) => {
              const inLayer = templates.filter(
                (each) => each.scope === layer.scope,
              );
              return inLayer.length === 0 ? null : (
                <SelectGroup key={layer.scope}>
                  <SelectLabel>{layer.label}</SelectLabel>
                  {inLayer.map((each) => (
                    <SelectItem key={each.key} value={each.key}>
                      {each.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
        {template ? (
          <Text id={`${id}-template-when`} variant="body-3" tone="muted">
            {templateHint(template)}
          </Text>
        ) : (
          value.templateKey === unlisted?.key && (
            <Text id={`${id}-template-when`} variant="body-3" tone="muted">
              Not in your list of templates, so it stays as it is unless you
              choose another.
            </Text>
          )
        )}
      </div>
    </div>
  );
}
