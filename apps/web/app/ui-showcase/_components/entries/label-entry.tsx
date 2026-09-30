import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Checkbox } from '@/components/atoms/checkbox';
import { Label } from '@/components/atoms/label';

export function LabelEntry() {
  return (
    <ShowcaseEntry
      name="Label"
      level="atom"
      origin="shadcn"
      source="components/atoms/label.tsx"
      summary="Names a control. Dims when the control before it (its peer) is disabled."
      useFor="Naming a Checkbox, RadioGroupItem or Switch placed next to it."
      avoidFor="Headings or plain text. It is a <label> and must point at a control."
      usage={`import { Checkbox } from '@/components/atoms/checkbox';

<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept the terms</Label>
</div>`}
      props={[
        {
          name: 'htmlFor',
          type: 'string',
          description: 'The id of the control it names.',
        },
        {
          name: '...rest',
          type: 'ComponentProps<typeof Label.Root>',
          description: 'Every native label prop.',
        },
      ]}
      accessibility={['Clicking the label focuses or toggles its control.']}
    >
      <StateCell label="Default" hint="Click the label">
        <div className="flex items-center gap-2">
          <Checkbox id="label-demo" />
          <Label htmlFor="label-demo">Send anonymously</Label>
        </div>
      </StateCell>
      <StateCell label="Peer disabled">
        <div className="flex items-center gap-2">
          <Checkbox id="label-demo-disabled" disabled />
          <Label htmlFor="label-demo-disabled">Send anonymously</Label>
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function LabelPreview() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="preview-label" defaultChecked />
      <Label htmlFor="preview-label">Send anonymously</Label>
    </div>
  );
}
