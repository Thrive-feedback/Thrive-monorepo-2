import { BoldIcon, ItalicIcon, StarIcon } from 'lucide-react';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Toggle } from '@/components/atoms/toggle';

export function ToggleEntry() {
  return (
    <ShowcaseEntry
      name="Toggle"
      level="atom"
      origin="shadcn"
      source="components/atoms/toggle.tsx"
      summary="A button that stays pressed until it is pressed again."
      useFor="Turning a mode or filter on and off in place: bold text, starred only, a view."
      avoidFor="A setting that saves (Switch), or a choice in a form (Checkbox)."
      usage={`import { Toggle } from '@/components/atoms/toggle';

<Toggle pressed={starredOnly} onPressedChange={setStarredOnly}>
  <StarIcon aria-hidden="true" className="size-4" />
  Starred
</Toggle>`}
      props={[
        {
          name: 'pressed / defaultPressed',
          type: 'boolean',
          description: 'Pressed or not, controlled or uncontrolled.',
        },
        {
          name: 'onPressedChange',
          type: '(pressed: boolean) => void',
          description: 'Called on every press.',
        },
        {
          name: 'variant',
          type: "'default' | 'outline'",
          defaultValue: "'default'",
          description:
            'Borderless, or with a border like the secondary Button.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg'",
          defaultValue: "'md'",
          description: '36, 40 or 48px tall, matching Button.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Blocks presses.',
        },
      ]}
      accessibility={[
        'Announced as a toggle button, pressed or not pressed.',
        'Pressed with Space or Enter.',
        'Name it for what it turns on ("Bold"), and give an icon-only toggle an aria-label.',
      ]}
    >
      <StateCell label="Off / on">
        <Toggle aria-label="Bold">
          <BoldIcon aria-hidden="true" className="size-4" />
        </Toggle>
        <Toggle aria-label="Italic" defaultPressed>
          <ItalicIcon aria-hidden="true" className="size-4" />
        </Toggle>
      </StateCell>
      <StateCell label="Outline, with text">
        <Toggle variant="outline">
          <StarIcon aria-hidden="true" className="size-4" />
          Starred
        </Toggle>
        <Toggle variant="outline" defaultPressed>
          <StarIcon aria-hidden="true" className="size-4" />
          Starred
        </Toggle>
      </StateCell>
      <StateCell label="Sizes">
        <Toggle size="sm" variant="outline">
          Small
        </Toggle>
        <Toggle size="md" variant="outline">
          Medium
        </Toggle>
        <Toggle size="lg" variant="outline">
          Large
        </Toggle>
      </StateCell>
      <StateCell label="Focused">
        <Toggle variant="outline" data-focus-preview>
          Focused
        </Toggle>
      </StateCell>
      <StateCell label="Disabled">
        <Toggle variant="outline" disabled>
          Off
        </Toggle>
        <Toggle variant="outline" disabled defaultPressed>
          On
        </Toggle>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TogglePreview() {
  return (
    <>
      <Toggle aria-label="Bold">
        <BoldIcon aria-hidden="true" className="size-4" />
      </Toggle>
      <Toggle aria-label="Italic" defaultPressed>
        <ItalicIcon aria-hidden="true" className="size-4" />
      </Toggle>
    </>
  );
}
