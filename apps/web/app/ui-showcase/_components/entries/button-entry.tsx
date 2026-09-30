import NextLink from 'next/link';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Button } from '@/components/atoms/button';

const USAGE = `import { Button } from '@/components/atoms/button';

<Button variant="primary" type="submit" loading={isSaving}>
  Save & Continue
</Button>

// A link that looks like an action keeps its link semantics:
<Button asChild variant="soft">
  <Link href="/ui-showcase">See the components</Link>
</Button>`;

export function ButtonEntry() {
  return (
    <ShowcaseEntry
      name="Button"
      level="atom"
      origin="shadcn"
      source="components/atoms/button.tsx"
      summary="Starts an action. One primary per view; everything else is secondary or quieter."
      useFor="Submitting a form, confirming, opening a dialog — anything that does something on this page."
      avoidFor="Going somewhere else. That is a Link, or a Button with asChild around one."
      usage={USAGE}
      props={[
        {
          name: 'variant',
          type: "'primary' | 'secondary' | 'soft' | 'ghost' | 'danger'",
          defaultValue: "'secondary'",
          description:
            'How loud the action is. Danger is for actions that destroy something.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg'",
          defaultValue: "'md'",
          description: 'Padding and type size.',
        },
        {
          name: 'loading',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Shows a spinner, sets aria-busy and blocks presses. The label stays.',
        },
        {
          name: 'asChild',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Paints its single child (usually a Link) as a button instead of rendering a <button>.',
        },
        {
          name: 'type',
          type: "'button' | 'submit' | 'reset'",
          defaultValue: "'button'",
          description:
            'Defaults to button so it never submits a form by accident.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'button'>",
          description: 'Every native button prop, including ref and aria-*.',
        },
      ]}
      accessibility={[
        'Reached with Tab, pressed with Enter or Space.',
        'Named by its text. An icon-only button needs aria-label.',
        'While loading it is announced as busy and keeps its name.',
      ]}
    >
      <StateCell label="Variants" hint="Hover and press them">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </StateCell>
      <StateCell label="Sizes">
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
      </StateCell>
      <StateCell label="Focused">
        <Button variant="primary" data-focus-preview>
          Primary
        </Button>
        <Button data-focus-preview>Secondary</Button>
      </StateCell>
      <StateCell label="Disabled">
        <Button variant="primary" disabled>
          Primary
        </Button>
        <Button disabled>Secondary</Button>
      </StateCell>
      <StateCell label="Loading">
        <Button variant="primary" loading>
          Saving
        </Button>
        <Button loading>Saving</Button>
      </StateCell>
      <StateCell label="As a link" hint="asChild around next/link">
        <Button asChild variant="soft">
          <NextLink href="/ui-showcase/tokens">See the tokens</NextLink>
        </Button>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function ButtonPreview() {
  return (
    <>
      <Button variant="primary" size="sm">
        Primary
      </Button>
      <Button size="sm">Secondary</Button>
    </>
  );
}
