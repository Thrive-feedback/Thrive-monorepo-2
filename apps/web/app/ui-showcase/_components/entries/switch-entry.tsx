import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Label } from '@/components/atoms/label';
import { Switch } from '@/components/atoms/switch';

export function SwitchEntry() {
  return (
    <ShowcaseEntry
      name="Switch"
      level="atom"
      origin="shadcn"
      source="components/atoms/switch.tsx"
      summary="Turns one setting on or off, taking effect immediately."
      useFor="Preferences and settings that save the moment they change."
      avoidFor="A choice that waits for a Submit button. Use a Checkbox."
      usage={`import { Label } from '@/components/atoms/label';

<div className="flex items-center gap-2">
  <Switch id="digest" checked={digest} onCheckedChange={setDigest} />
  <Label htmlFor="digest">Weekly digest</Label>
</div>`}
      props={[
        {
          name: 'checked / defaultChecked',
          type: 'boolean',
          description: 'On or off, controlled or uncontrolled.',
        },
        {
          name: 'onCheckedChange',
          type: '(checked: boolean) => void',
          description: 'Called on every toggle.',
        },
        {
          name: 'size',
          type: "'sm' | 'md'",
          defaultValue: "'md'",
          description: 'Track and thumb size.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Blocks changes.',
        },
      ]}
      accessibility={[
        'Toggled with Space.',
        'Announced as a switch that is on or off.',
      ]}
    >
      <StateCell label="Off / on">
        <Switch aria-label="Off" />
        <Switch aria-label="On" defaultChecked />
      </StateCell>
      <StateCell label="Small">
        <Switch aria-label="Small off" size="sm" />
        <Switch aria-label="Small on" size="sm" defaultChecked />
      </StateCell>
      <StateCell label="With a label">
        <div className="flex items-center gap-2">
          <Switch id="switch-digest" defaultChecked />
          <Label htmlFor="switch-digest">Weekly digest</Label>
        </div>
      </StateCell>
      <StateCell label="Focused">
        <Switch aria-label="Focused" data-focus-preview />
      </StateCell>
      <StateCell label="Disabled">
        <Switch aria-label="Disabled off" disabled />
        <Switch aria-label="Disabled on" disabled defaultChecked />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function SwitchPreview() {
  return (
    <>
      <Switch aria-label="Off" />
      <Switch aria-label="On" defaultChecked />
    </>
  );
}
