'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  Undo2Icon,
} from 'lucide-react';
import { useId, useState } from 'react';
import { MockView } from '@/app/ui-showcase/one-on-ones/missed/_components/missed-mocks';
import {
  addDays,
  CADENCE_WORDS,
  type Cadence,
  type Day,
  describe,
  type MeetingEvent,
  type Scenario,
  simulate,
  WEEKDAY_NAMES,
} from '@/app/ui-showcase/one-on-ones/missed/_lib/missed-meeting.model';
import {
  FIRST_DAY,
  LAST_DAY,
  MISSED_CASES,
} from '@/app/ui-showcase/one-on-ones/missed/_lib/missed-meeting-cases.constant';
import { Button } from '@/components/atoms/button';
import { Label } from '@/components/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Text } from '@/components/atoms/text';

const CADENCES: readonly Cadence[] = [
  'WEEKLY',
  'EVERY_TWO_WEEKS',
  'MONTHLY',
  'ONCE',
];

/** What Write a topic adds, in turn. */
const TOPICS = [
  'Launch retro',
  'Career path',
  'Hiring plan',
  'Offsite',
  'Budget',
] as const;

const DAY_COUNT =
  (Date.parse(`${LAST_DAY}T00:00:00Z`) - Date.parse(`${FIRST_DAY}T00:00:00Z`)) /
  86_400_000;

function offsetOf(day: Day): number {
  return (
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${FIRST_DAY}T00:00:00Z`)) /
    86_400_000
  );
}

/** What an action was, said in the log. */
function said(event: MeetingEvent): string {
  switch (event.kind) {
    case 'write':
      return `Wrote “${event.text}”`;
    case 'template':
      return `Used ${event.name}`;
    case 'start':
      return 'Started the meeting';
    case 'finish':
      return 'Finished the meeting';
    case 'reschedule':
      return `Moved it to ${WEEKDAY_NAMES[event.weekday - 1]}s`;
    case 'end':
      return 'Ended the schedule';
  }
}

const FRESH = 'fresh';
const PRESETS = MISSED_CASES.flatMap(({ cadence, cases }) =>
  cases.map((each) => ({
    ...each,
    label: `${CADENCE_WORDS[cadence]} · ${each.title}`,
  })),
);

/**
 * A 1:1 to play with. Pick how often it meets, step the day, and act as either person
 * would; the card, the meeting and Past meetings follow the agreed rules. An action happens on the
 * day shown; acting on an earlier day takes back what was done after it.
 */
export function MissedSimulator() {
  const id = useId();
  const [scenario, setScenario] = useState<Scenario>({
    cadence: 'WEEKLY',
    startsOn: FIRST_DAY,
    events: [],
  });
  const [today, setToday] = useState<Day>(FIRST_DAY);
  const [preset, setPreset] = useState<string>(FRESH);
  const [weekday, setWeekday] = useState(4);
  /** A number per action, so the log keys each one apart from another alike. */
  const [stamps, setStamps] = useState<readonly number[]>([]);
  const view = simulate(scenario, today);
  const done = scenario.events.filter((event) => event.day <= today);
  const undone = scenario.events.length - done.length;

  function act(event: MeetingEvent) {
    // What was done after today is taken back: the day shown is now.
    setScenario({ ...scenario, events: [...done, event] });
    setStamps([
      ...stamps.slice(0, done.length),
      (stamps[stamps.length - 1] ?? 0) + 1,
    ]);
    setPreset(FRESH);
  }

  function choosePreset(next: string) {
    setPreset(next);
    const found = PRESETS.find((each) => each.id === next);
    if (found) {
      setScenario(found.scenario);
      setToday(found.today);
    }
  }

  function chooseCadence(next: string) {
    const cadence = CADENCES.find((each) => each === next);
    if (cadence) {
      setScenario({ cadence, startsOn: FIRST_DAY, events: [] });
      setToday(FIRST_DAY);
      setPreset(FRESH);
    }
  }

  const nextTopic =
    TOPICS[
      done.filter((event) => event.kind === 'write').length % TOPICS.length
    ] ?? 'A topic';

  return (
    <div className="flex flex-col gap-6 rounded-page border border-border-muted p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-preset`}>Start from a case</Label>
          <Select value={preset} onValueChange={choosePreset}>
            <SelectTrigger id={`${id}-preset`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FRESH}>Nothing done yet</SelectItem>
              {PRESETS.map((each) => (
                <SelectItem key={each.id} value={each.id}>
                  {each.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-cadence`}>How often</Label>
          <Select value={scenario.cadence} onValueChange={chooseCadence}>
            <SelectTrigger id={`${id}-cadence`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CADENCES.map((cadence) => (
                <SelectItem key={cadence} value={cadence}>
                  {cadence === 'ONCE'
                    ? 'Once, on Tue 1 Dec'
                    : `${CADENCE_WORDS[cadence]}, Tuesdays from 1 Dec`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-today`}>Today</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="The day before"
            disabled={today <= FIRST_DAY}
            onClick={() => setToday(addDays(today, -1))}
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
          </Button>
          <input
            id={`${id}-today`}
            type="range"
            min={0}
            max={DAY_COUNT}
            value={offsetOf(today)}
            aria-valuetext={describe(today)}
            onChange={(event) =>
              setToday(addDays(FIRST_DAY, Number(event.currentTarget.value)))
            }
            className="min-w-0 flex-1 accent-action-primary"
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="The day after"
            disabled={today >= LAST_DAY}
            onClick={() => setToday(addDays(today, 1))}
          >
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </Button>
          <Text
            as="span"
            variant="subtitle-3"
            className="w-28 shrink-0 text-end tabular-nums"
          >
            {describe(today)}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text as="p" variant="label">
          Act on {describe(today)}
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!view.may.has('write')}
            onClick={() => act({ kind: 'write', day: today, text: nextTopic })}
          >
            Write a topic
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!view.may.has('template')}
            onClick={() =>
              act({ kind: 'template', day: today, name: 'Sprint retro' })
            }
          >
            Add from template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!view.may.has('start')}
            onClick={() => act({ kind: 'start', day: today })}
          >
            Start
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!view.may.has('finish')}
            onClick={() => act({ kind: 'finish', day: today })}
          >
            Finish
          </Button>
          <span className="flex items-center gap-2">
            <Select
              value={String(weekday)}
              onValueChange={(next) => setWeekday(Number(next))}
              disabled={!view.may.has('reschedule')}
            >
              <SelectTrigger aria-label="New day" className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_NAMES.map((name, index) => (
                  <SelectItem key={name} value={String(index + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              disabled={!view.may.has('reschedule')}
              onClick={() => act({ kind: 'reschedule', day: today, weekday })}
            >
              Change day
            </Button>
          </span>
          <Button
            variant="ghost-danger"
            size="sm"
            disabled={!view.may.has('end')}
            onClick={() => act({ kind: 'end', day: today })}
          >
            {scenario.cadence === 'ONCE' ? 'Cancel meeting' : 'End schedule'}
          </Button>
        </div>
      </div>

      {/* What the page would show, said once it changes. */}
      <div aria-live="polite" className="sr-only">
        {view.step
          ? `${view.step.word}, ${view.step.when}`
          : `In History: ${view.card.line}`}
      </div>
      <div className="rounded-control bg-surface-raised p-4">
        <MockView view={view} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Text as="p" variant="label">
            What was done
          </Text>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={done.length === 0}
              prefixIcon={<Undo2Icon aria-hidden="true" className="size-3.5" />}
              onClick={() =>
                setScenario({ ...scenario, events: done.slice(0, -1) })
              }
            >
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              prefixIcon={
                <RotateCcwIcon aria-hidden="true" className="size-3.5" />
              }
              onClick={() => {
                setScenario({ ...scenario, events: [] });
                setToday(FIRST_DAY);
                setPreset(FRESH);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
        {scenario.events.length === 0 ? (
          <Text as="p" variant="body-3" tone="muted">
            Nothing yet. Step the day, or act.
          </Text>
        ) : (
          <ol className="flex flex-col gap-1">
            {scenario.events.map((event, at) => (
              <li
                key={
                  stamps[at] ?? `${event.kind}-${event.day}-preset-${at + 1}`
                }
                className="flex gap-3"
              >
                <Text
                  as="span"
                  variant="body-3"
                  tone="muted"
                  className="w-24 shrink-0 tabular-nums"
                >
                  {describe(event.day)}
                </Text>
                <Text
                  as="span"
                  variant="body-3"
                  tone={event.day > today ? 'muted' : 'default'}
                >
                  {said(event)}
                  {event.day > today && ' (later: not yet)'}
                </Text>
              </li>
            ))}
          </ol>
        )}
        {undone > 0 && (
          <Text as="p" variant="body-3" tone="muted">
            Acting today takes back what was done after it.
          </Text>
        )}
      </div>
    </div>
  );
}
