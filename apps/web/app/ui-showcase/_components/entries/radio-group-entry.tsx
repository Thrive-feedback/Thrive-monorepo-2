import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Label } from '@/components/atoms/label';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'] as const;

export function RadioGroupEntry() {
  return (
    <ShowcaseEntry
      name="RadioGroup"
      level="atom"
      origin="shadcn"
      source="components/atoms/radio-group.tsx — RadioGroup, RadioGroupItem"
      summary="Chooses exactly one of a few options, all visible at once."
      useFor="Two to about five mutually exclusive options the person should compare."
      avoidFor="Many options (Select) or on/off (Switch, Checkbox)."
      usage={`import { Label } from '@/components/atoms/label';

<RadioGroup aria-label="Frequency" value={frequency} onValueChange={setFrequency}>
  <div className="flex items-center gap-2">
    <RadioGroupItem id="weekly" value="weekly" />
    <Label htmlFor="weekly">Weekly</Label>
  </div>
</RadioGroup>`}
      props={[
        {
          name: 'value / defaultValue',
          type: 'string',
          description: 'The chosen item, controlled or uncontrolled.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: 'Called when the choice changes.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'On the group, or on one RadioGroupItem.',
        },
        {
          name: 'orientation',
          type: "'vertical' | 'horizontal'",
          description: 'Which arrow keys move between items.',
        },
        {
          name: 'RadioGroupItem value',
          type: 'string',
          description: 'This item’s value. Required.',
        },
      ]}
      accessibility={[
        'The group is one Tab stop; arrow keys move and choose.',
        'Name the group with aria-label or aria-labelledby.',
      ]}
    >
      <StateCell label="Default" hint="Tab in, then use the arrows">
        <RadioGroup aria-label="Frequency" defaultValue="Weekly">
          {FREQUENCIES.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem id={`radio-${option}`} value={option} />
              <Label htmlFor={`radio-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </StateCell>
      <StateCell label="Focused">
        <RadioGroup aria-label="Focused" defaultValue="on">
          <RadioGroupItem value="on" aria-label="Focused" data-focus-preview />
        </RadioGroup>
      </StateCell>
      <StateCell label="Invalid">
        <RadioGroup aria-label="Invalid">
          <RadioGroupItem value="a" aria-label="Invalid" aria-invalid />
        </RadioGroup>
      </StateCell>
      <StateCell label="Disabled">
        <RadioGroup aria-label="Disabled" defaultValue="Daily" disabled>
          {FREQUENCIES.slice(0, 2).map((option) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem id={`radio-off-${option}`} value={option} />
              <Label htmlFor={`radio-off-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function RadioGroupPreview() {
  return (
    <RadioGroup aria-label="Frequency" defaultValue="weekly">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="preview-daily" value="daily" />
        <Label htmlFor="preview-daily">Daily</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="preview-weekly" value="weekly" />
        <Label htmlFor="preview-weekly">Weekly</Label>
      </div>
    </RadioGroup>
  );
}
