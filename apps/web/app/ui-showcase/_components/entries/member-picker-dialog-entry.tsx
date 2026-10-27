import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { MemberPickerDemo } from './member-picker-demo';

export function MemberPickerDialogEntry() {
  return (
    <ShowcaseEntry
      name="MemberPickerDialog"
      level="organism"
      origin="thrive"
      source="components/organisms/member-picker-dialog.tsx — composes Dialog, Input, Checkbox, Avatar, Button"
      summary="Choosing several teammates in a dialog, by ticking them or by typing @handles."
      useFor="Who to ask, who Feedback or a letter is for, who else can read it. Open it from an AvatarGroupButton."
      avoidFor="Choosing from a short fixed list that is not people. Use RadioGroup or Select."
      usage={`import { MemberPickerDialog } from '@/components/organisms/member-picker-dialog';

<AvatarGroupButton label="Choose who to ask" people={chosen} onClick={() => setOpen(true)} />
<MemberPickerDialog
  teammates={teammates}
  value={accountIds}
  title="Choose who to ask"
  description="They each answer in their own words."
  open={open}
  onOpenChange={setOpen}
  onDone={setAccountIds}
/>`}
      props={[
        {
          name: 'teammates',
          type: 'Teammate[]',
          description:
            'Everyone who can be chosen, in the order they are listed.',
        },
        {
          name: 'value',
          type: 'string[]',
          description:
            'The Account ids chosen now. Each opening starts from them.',
        },
        {
          name: 'title / description',
          type: 'string / ReactNode',
          description:
            'What is being chosen, and who reads it whatever is chosen.',
        },
        {
          name: 'open / onOpenChange',
          type: 'boolean / (open: boolean) => void',
          description: 'Whether it is open. Done closes it too.',
        },
        {
          name: 'onDone',
          type: '(accountIds: string[]) => void',
          description: 'Done was pressed: the people now chosen.',
        },
        {
          name: 'onCancel',
          type: '() => void',
          description:
            'It closed any other way — Cancel, ×, Escape, a click outside — and nothing changed.',
        },
      ]}
      accessibility={[
        'A dialog named by its title; focus starts in the search field and returns to the button that opened it.',
        'Each row is one label: the name names the checkbox and the email describes it.',
        'A handle that names nobody is said under the field and announced.',
        'How many are chosen is announced as it changes.',
      ]}
    >
      <StateCell label="Nobody chosen yet">
        <MemberPickerDemo />
      </StateCell>
      <StateCell label="Some chosen">
        <MemberPickerDemo initial={['mali', 'krit', 'ann', 'ben', 'dao']} />
      </StateCell>
      <StateCell label="Empty Workspace">
        <MemberPickerDemo teammates={[]} />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function MemberPickerDialogPreview() {
  return <MemberPickerDemo initial={['mali', 'krit', 'ann']} />;
}
