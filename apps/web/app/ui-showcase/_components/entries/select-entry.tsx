import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';

function TeamItems() {
  return (
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Teams</SelectLabel>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="engineering">Engineering</SelectItem>
        <SelectItem value="people" disabled>
          People
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  );
}

export function SelectEntry() {
  return (
    <ShowcaseEntry
      name="Select"
      level="atom"
      origin="shadcn"
      source="components/atoms/select.tsx — Select, SelectTrigger, SelectValue, SelectContent, SelectItem…"
      summary="Chooses one option from a list too long to show at once."
      useFor="Six or more options, or a list that would crowd the form."
      avoidFor="A few options worth comparing side by side (RadioGroup)."
      usage={`import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/atoms/select';

<Select value={team} onValueChange={setTeam}>
  <SelectTrigger aria-label="Team">
    <SelectValue placeholder="Pick a team" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="design">Design</SelectItem>
    <SelectItem value="engineering">Engineering</SelectItem>
  </SelectContent>
</Select>`}
      props={[
        {
          name: 'value / defaultValue',
          type: 'string',
          description: 'The chosen item, controlled or uncontrolled.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: 'Called when an item is picked.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'On Select, or on one SelectItem.',
        },
        {
          name: 'SelectTrigger aria-invalid',
          type: 'boolean',
          description: 'The error state.',
        },
        {
          name: 'SelectValue placeholder',
          type: 'ReactNode',
          description: 'Shown until something is chosen.',
        },
        {
          name: 'name / required',
          type: 'string / boolean',
          description: 'Take part in a native form submission.',
        },
      ]}
      accessibility={[
        'The trigger is a combobox; Enter, Space or the arrows open it.',
        'Arrows move through options, typing jumps to one, Escape closes.',
        'Name it with a Label (htmlFor on the trigger id) or aria-label.',
      ]}
    >
      <StateCell label="Placeholder" hint="Open it">
        <Select>
          <SelectTrigger aria-label="Team">
            <SelectValue placeholder="Pick a team" />
          </SelectTrigger>
          <TeamItems />
        </Select>
      </StateCell>
      <StateCell label="Chosen">
        <Select defaultValue="design">
          <SelectTrigger aria-label="Team, chosen">
            <SelectValue />
          </SelectTrigger>
          <TeamItems />
        </Select>
      </StateCell>
      <StateCell label="Focused">
        <Select>
          <SelectTrigger aria-label="Team, focused" data-focus-preview>
            <SelectValue placeholder="Pick a team" />
          </SelectTrigger>
          <TeamItems />
        </Select>
      </StateCell>
      <StateCell label="Invalid">
        <Select>
          <SelectTrigger aria-label="Team, invalid" aria-invalid>
            <SelectValue placeholder="Pick a team" />
          </SelectTrigger>
          <TeamItems />
        </Select>
      </StateCell>
      <StateCell label="Disabled">
        <Select disabled defaultValue="engineering">
          <SelectTrigger aria-label="Team, disabled">
            <SelectValue />
          </SelectTrigger>
          <TeamItems />
        </Select>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function SelectPreview() {
  return (
    <Select defaultValue="design">
      <SelectTrigger aria-label="Team">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="design">Design</SelectItem>
      </SelectContent>
    </Select>
  );
}
