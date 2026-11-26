import { TimePickerDemo } from '@/app/ui-showcase/_components/entries/calendar-demo';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';

export function TimePickerEntry() {
  return (
    <ShowcaseEntry
      name="TimePicker"
      level="molecule"
      origin="thrive"
      source="components/molecules/time-picker.tsx"
      summary="A field that reads like the other inputs, showing the time, which opens an hour column and a minute column beside it."
      useFor="A time of day in a form, such as when a 1:1 meets."
      avoidFor="A length of time (use a Select of lengths) or a date (DatePicker)."
      usage={`import { TimePicker } from '@/components/molecules/time-picker';

<Label htmlFor="time">Time</Label>
<TimePicker id="time" value={startMinute} onChange={setStartMinute} aria-describedby="time-zone" />`}
      props={[
        {
          name: 'value / onChange',
          type: 'number | null',
          description: 'Minutes after midnight.',
        },
        {
          name: 'stepMinutes',
          type: 'number',
          defaultValue: '15',
          description: 'How far apart the minutes offered are.',
        },
        {
          name: 'id / aria-describedby',
          type: 'string',
          description: 'For a Label, and the line that says the time zone.',
        },
        {
          name: 'placeholder',
          type: 'string',
          defaultValue: '“Choose a time”',
          description: 'Shown while no time is set.',
        },
      ]}
      accessibility={[
        'The field is a button that opens the two columns, focused on the chosen hour.',
        'Each column is a named list of buttons; Up and Down move, Enter chooses, and the chosen one is pressed.',
        'Choosing the hour keeps it open; choosing the minutes closes it and returns focus to the field.',
      ]}
    >
      <StateCell label="A time set">
        <TimePickerDemo id="time-picker-set" label="Time" initial={600} />
      </StateCell>
      <StateCell label="Empty">
        <TimePickerDemo id="time-picker-empty" label="Time" />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TimePickerPreview() {
  return <TimePickerDemo id="time-picker-preview" label="Time" initial={600} />;
}
