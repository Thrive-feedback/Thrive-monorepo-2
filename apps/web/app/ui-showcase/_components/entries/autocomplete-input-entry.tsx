import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { AutocompleteInputDemo } from './tag-autocomplete-demo';

export function AutocompleteInputEntry() {
  return (
    <ShowcaseEntry
      name="AutocompleteInput"
      level="molecule"
      origin="thrive"
      source="components/molecules/autocomplete-input.tsx — Input + suggestion chips + coloured tags"
      summary="The one-line AutocompleteTextarea: completes tags as they are typed and colours those that name something. A long line scrolls, and the colours scroll with it."
      useFor="A short line that can name things, such as a Feedback Topic. TextField takes the same triggers."
      avoidFor="Anything longer than a line; use AutocompleteTextarea."
      usage={`import { AutocompleteInput } from '@/components/molecules/autocomplete-input';

<AutocompleteInput
  aria-label="Topic"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  triggers={triggers}
/>`}
      props={[
        {
          name: 'value',
          type: 'string',
          description:
            'Controlled. Picking a suggestion goes through onChange like typing does.',
        },
        {
          name: 'triggers',
          type: 'readonly AutocompleteTrigger[]',
          description: 'As for AutocompleteTextarea.',
        },
        {
          name: '...rest',
          type: 'InputProps',
          description: 'Everything an Input takes, variant and size included.',
        },
      ]}
      accessibility={[
        'A combobox with aria-expanded and aria-controls naming the suggestions.',
        'Enter picks a suggestion while they are open, and never submits the form then.',
      ]}
    >
      <StateCell label="Empty — type # or @">
        <AutocompleteInputDemo />
      </StateCell>
      <StateCell label="With tags">
        <AutocompleteInputDemo initial="The launch #ownership with @somchai.k" />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function AutocompleteInputPreview() {
  return <AutocompleteInputDemo initial="The launch #ownership" />;
}
