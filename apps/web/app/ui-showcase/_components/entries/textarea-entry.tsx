import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Textarea } from '@/components/atoms/textarea';

export function TextareaEntry() {
  return (
    <ShowcaseEntry
      name="Textarea"
      level="atom"
      origin="shadcn"
      source="components/atoms/textarea.tsx"
      summary="The bare multi-line control. Grows with its content from a three-line minimum."
      useFor="Building a new molecule."
      avoidFor="A form field. Use TextAreaField."
      usage={`import { Textarea } from '@/components/atoms/textarea';

<Textarea aria-label="Note" />`}
      props={[
        {
          name: 'aria-invalid',
          type: 'boolean',
          description: 'The error state.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'textarea'>",
          description: 'Every native textarea prop, including ref.',
        },
      ]}
      accessibility={['Needs a name, the same way Input does.']}
    >
      <StateCell label="Default">
        <Textarea aria-label="Default" placeholder="Type a few lines" />
      </StateCell>
      <StateCell label="Invalid">
        <Textarea aria-label="Invalid" aria-invalid />
      </StateCell>
      <StateCell label="Disabled">
        <Textarea aria-label="Disabled" defaultValue="Read only" disabled />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TextareaPreview() {
  return <Textarea aria-label="Note" placeholder="Type a few lines" />;
}
