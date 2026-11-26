import { CalendarDemo } from '@/app/ui-showcase/_components/entries/calendar-demo';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';

export function CalendarEntry() {
  return (
    <ShowcaseEntry
      name="Calendar"
      level="atom"
      origin="thrive"
      source="components/atoms/calendar.tsx"
      summary="One month to choose a day from, Monday first, in the product's plum. Days are YYYY-MM-DD strings, so no time zone moves them."
      useFor="Inside DatePicker; on its own where a month should stay open on the page."
      avoidFor="A field in a form: use DatePicker, which reads like the other inputs."
      usage={`import { Calendar } from '@/components/atoms/calendar';

<Calendar value={day} onChange={setDay} min={todayInBangkok()} today={todayInBangkok()} />`}
      props={[
        {
          name: 'value',
          type: 'string | null',
          description: 'The chosen day, YYYY-MM-DD.',
        },
        {
          name: 'onChange',
          type: '(day: string) => void',
          description: 'Called with the day pressed.',
        },
        {
          name: 'min / max',
          type: 'string',
          description: 'Days outside show faint and cannot be chosen.',
        },
        {
          name: 'today',
          type: 'string',
          description:
            'What counts as today; the browser’s day when not given.',
        },
        {
          name: 'autoFocus',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Focus the chosen day on first draw, as inside a picker.',
        },
      ]}
      accessibility={[
        'A table of day buttons named by its month, with the weekdays as column headers.',
        'Arrows move a day and a week, Home and End to the week’s ends, Page Up and Page Down a month (Shift for a year).',
        'Only the focused day is a tab stop; today is aria-current="date" and the chosen day is pressed.',
      ]}
    >
      <StateCell label="A day chosen, today ringed">
        <CalendarDemo />
      </StateCell>
      <StateCell label="Days before today disabled" hint="min">
        <CalendarDemo initial={null} min="2026-11-26" />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function CalendarPreview() {
  return <CalendarDemo />;
}
