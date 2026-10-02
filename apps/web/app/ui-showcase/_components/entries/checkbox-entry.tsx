import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Checkbox } from '@/components/atoms/checkbox';
import { Label } from '@/components/atoms/label';

export function CheckboxEntry() {
  return (
    <ShowcaseEntry
      name="Checkbox"
      level="atom"
      origin="shadcn"
      source="components/atoms/checkbox.tsx"
      summary="Chooses any number of options, or agrees to one thing. Submitted with the form."
      useFor="Multi-select lists, 'remember me', accepting terms."
      avoidFor="A setting that applies at once (Switch) or one choice among several (RadioGroup)."
      usage={`import { Checkbox } from '@/components/atoms/checkbox';

<div className="flex items-center gap-2">
  <Checkbox id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
  <Label htmlFor="anonymous">Send anonymously</Label>
</div>`}
      props={[
        {
          name: 'checked',
          type: "boolean | 'indeterminate'",
          description: 'Controlled state. Pair with onCheckedChange.',
        },
        {
          name: 'defaultChecked',
          type: 'boolean',
          description: 'Uncontrolled starting state.',
        },
        {
          name: 'onCheckedChange',
          type: "(checked: boolean | 'indeterminate') => void",
          description: 'Called on every toggle.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Blocks changes; a peer Label dims with it.',
        },
        {
          name: 'aria-invalid',
          type: 'boolean',
          description: 'The error state.',
        },
        {
          name: 'name / value / required',
          type: 'string / string / boolean',
          description: 'Take part in a native form submission.',
        },
      ]}
      accessibility={[
        'Toggled with Space.',
        'Announced as a checkbox; indeterminate is announced as “mixed”.',
      ]}
    >
      <StateCell label="Unchecked / checked / indeterminate">
        <Checkbox aria-label="Unchecked" />
        <Checkbox aria-label="Checked" defaultChecked />
        <Checkbox aria-label="Indeterminate" checked="indeterminate" />
      </StateCell>
      <StateCell label="With a label" hint="Click the label">
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-anonymous" />
          <Label htmlFor="checkbox-anonymous">Send anonymously</Label>
        </div>
      </StateCell>
      <StateCell label="Focused">
        <Checkbox aria-label="Focused" data-focus-preview />
      </StateCell>
      <StateCell label="Invalid">
        <Checkbox aria-label="Invalid" aria-invalid />
      </StateCell>
      <StateCell label="Disabled">
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-disabled" disabled />
          <Label htmlFor="checkbox-disabled">Off</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-disabled-on" disabled defaultChecked />
          <Label htmlFor="checkbox-disabled-on">On</Label>
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function CheckboxPreview() {
  return (
    <>
      <Checkbox aria-label="Off" />
      <Checkbox aria-label="On" defaultChecked />
      <Checkbox aria-label="Some" checked="indeterminate" />
    </>
  );
}
