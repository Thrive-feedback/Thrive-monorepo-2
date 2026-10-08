import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Input } from '@/components/atoms/input';

export function InputEntry() {
  return (
    <ShowcaseEntry
      name="Input"
      level="atom"
      origin="shadcn"
      source="components/atoms/input.tsx"
      summary="The bare single-line control TextField is built from. It has no label of its own."
      useFor="Building a new molecule, or a search box labelled by aria-label."
      avoidFor="A form field. Use TextField, which brings the label and the error line."
      usage={`import { Checkbox } from '@/components/atoms/checkbox';

<Input aria-label="Search people" type="search" />`}
      props={[
        {
          name: 'variant',
          type: "'outlined' | 'filled' | 'standard'",
          defaultValue: "'outlined'",
          description:
            'Outlined draws a border; filled sits on a light tint; standard on a solid grey.',
        },
        {
          name: 'size',
          type: "'sm' | 'md'",
          defaultValue: "'md'",
          description:
            'Control height and type size: md is 44px, sm 32px. Not the native size attribute.',
        },
        {
          name: 'type',
          type: 'HTMLInputTypeAttribute',
          defaultValue: "'text'",
          description: 'Any native input type.',
        },
        {
          name: 'aria-invalid',
          type: 'boolean',
          description: 'The error state: red border, announced as invalid.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'input'>",
          description: 'Every native input prop, including ref.',
        },
      ]}
      accessibility={[
        'Needs a name from somewhere: a <Label htmlFor>, aria-label or aria-labelledby.',
      ]}
    >
      <StateCell label="Default">
        <Input aria-label="Default" placeholder="Placeholder" />
      </StateCell>
      <StateCell label="Focused">
        <Input aria-label="Focused" defaultValue="Tony" data-focus-preview />
      </StateCell>
      <StateCell label="Invalid">
        <Input aria-label="Invalid" defaultValue="tony@" aria-invalid />
      </StateCell>
      <StateCell label="Disabled">
        <Input aria-label="Disabled" defaultValue="Read only" disabled />
      </StateCell>
      <StateCell label="Variants">
        <Input aria-label="Outlined" placeholder="Outlined" />
        <Input aria-label="Filled" variant="filled" placeholder="Filled" />
        <Input
          aria-label="Standard"
          variant="standard"
          placeholder="Standard"
        />
      </StateCell>
      <StateCell label="Small">
        <Input aria-label="Small" size="sm" placeholder="Placeholder" />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function InputPreview() {
  return <Input aria-label="Name" placeholder="Enter your name" />;
}
