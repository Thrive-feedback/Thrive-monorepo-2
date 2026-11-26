import { DatePickerDemo } from '@/app/ui-showcase/_components/entries/calendar-demo';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';

export function DatePickerEntry() {
  return (
    <ShowcaseEntry
      name="DatePicker"
      level="molecule"
      origin="thrive"
      source="components/molecules/date-picker.tsx"
      summary="A field that reads like the other inputs, showing the day in words, which opens Thrive's Calendar beside it."
      useFor="Any day in a form, such as the day of a 1:1 held just once."
      avoidFor="A time of day, or a range of days."
      usage={`import { DatePicker } from '@/components/molecules/date-picker';

<Label htmlFor="due">Due</Label>
<DatePicker id="due" value={dueOn} onChange={setDueOn} today={todayInBangkok()} clearable />`}
      props={[
        {
          name: 'value / onChange',
          type: 'string | null',
          description: 'The chosen day; null when cleared.',
        },
        { name: 'id', type: 'string', description: 'For a Label’s htmlFor.' },
        {
          name: 'min / max / today',
          type: 'string',
          description:
            'Passed to the Calendar; Today shows only where it may be chosen.',
        },
        {
          name: 'clearable',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Offers Clear, for an optional day.',
        },
        {
          name: 'placeholder',
          type: 'string',
          defaultValue: '“Choose a day”',
          description: 'Shown while no day is chosen.',
        },
      ]}
      accessibility={[
        'The field is a button that opens a dialog with the month, focused on the chosen day or today.',
        'Choosing a day closes it and returns focus to the field; Escape closes it without a change.',
      ]}
    >
      <StateCell label="Empty, optional" hint="Today and Clear">
        <DatePickerDemo
          id="date-picker-due"
          label="Due"
          placeholder="Due (optional)"
          clearable
        />
      </StateCell>
      <StateCell label="A day chosen, past days disabled">
        <DatePickerDemo
          id="date-picker-once"
          label="Date"
          initial="2026-12-02"
          min="2026-11-26"
        />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function DatePickerPreview() {
  return (
    <DatePickerDemo
      id="date-picker-preview"
      label="Date"
      initial="2026-12-02"
    />
  );
}
