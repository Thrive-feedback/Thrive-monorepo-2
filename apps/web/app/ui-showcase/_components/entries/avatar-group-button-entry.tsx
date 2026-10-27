import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { AvatarGroupButton } from '@/components/molecules/avatar-group-button';

const PEOPLE = [
  { id: 'ts', name: 'Tida Somsri' },
  { id: 'pp', name: 'Pim Prasert' },
  { id: 'hh', name: 'Hana Hoshi' },
  { id: 'nr', name: 'Nok Rattana' },
  { id: 'sr', name: 'Som Ruang' },
  { id: 'bb', name: 'Ben Boon' },
  { id: 'cb', name: 'Chai Boonma' },
];

export function AvatarGroupButtonEntry() {
  return (
    <ShowcaseEntry
      name="AvatarGroupButton"
      level="molecule"
      origin="thrive"
      source="components/molecules/avatar-group-button.tsx — composes AvatarGroup, Avatar, Tooltip"
      summary='The people chosen so far as an overlapping stack, ending in a dashed "+" the size of one face.'
      useFor="Choosing several people where the choice opens elsewhere: who to ask, who it is for, who else can read it."
      avoidFor="Showing people nobody can change. Use AvatarGroup."
      usage={`import { AvatarGroupButton } from '@/components/molecules/avatar-group-button';

<AvatarGroupButton
  label="Choose who to ask"
  people={chosen.map((teammate) => ({ id: teammate.accountId, name: teammate.name }))}
  onClick={() => setOpen(true)}
/>`}
      props={[
        {
          name: 'people',
          type: '{ id: string; name: string }[]',
          description: 'The people chosen so far, in the order they stack.',
        },
        {
          name: 'label',
          type: 'string',
          description:
            'What pressing it does, such as "Choose who to ask". Heard before the names.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg'",
          defaultValue: "'lg'",
          description: 'The size of each face and of the "+".',
        },
        {
          name: 'invalid',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Nobody chosen where somebody must be.',
        },
      ]}
      accessibility={[
        'One button, so faces and "+" are one tab stop doing one thing.',
        'Named by its label and then every name chosen, those past max included.',
        'Each face says its full name on hover; "+N" lists who it stands for.',
        'aria-invalid when nobody is chosen where somebody must be.',
      ]}
    >
      <StateCell label="Nobody chosen">
        <AvatarGroupButton people={[]} label="Choose who to ask" />
      </StateCell>
      <StateCell label="A few people">
        <AvatarGroupButton
          people={PEOPLE.slice(0, 3)}
          label="Choose who to ask"
        />
      </StateCell>
      <StateCell label="More than max">
        <AvatarGroupButton people={PEOPLE} label="Choose who to ask" />
      </StateCell>
      <StateCell label="Invalid">
        <AvatarGroupButton people={[]} label="Choose who to ask" invalid />
      </StateCell>
      <StateCell label="Medium">
        <AvatarGroupButton
          people={PEOPLE.slice(0, 5)}
          label="Choose who else can read"
          size="md"
        />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function AvatarGroupButtonPreview() {
  return (
    <AvatarGroupButton people={PEOPLE} label="Choose who to ask" size="md" />
  );
}
