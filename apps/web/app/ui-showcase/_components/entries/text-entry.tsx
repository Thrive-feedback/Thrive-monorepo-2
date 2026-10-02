import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';

const USAGE = `import { Text } from '@/components/atoms/text';

<Text variant="display3" as="h1">Let’s make it official.</Text>
<Text variant="body2" tone="muted">May I ask how you would like to be introduced?</Text>

// Looks like h6, is the page's second-level heading:
<Text variant="h6" as="h2">Your Workspace</Text>`;

export function TextEntry() {
  return (
    <ShowcaseEntry
      name="Text"
      level="atom"
      origin="thrive"
      source="components/atoms/text.tsx"
      summary="Sets text in one of the design's type styles, on whichever element the content is."
      useFor="Every heading, paragraph and caption on a screen — the style from the design, the element from the page outline."
      avoidFor="Text inside another atom; atoms use the type utilities (text-body2…) directly."
      usage={USAGE}
      props={[
        {
          name: 'variant',
          type: "'display1'…'display6' | 'h1'…'h6' | 'subtitle1'…'subtitle4' | 'body1'…'body3' | 'caption' | 'overline'",
          defaultValue: "'body1'",
          description:
            'The design text style. Display styles are set in Cooper, the rest in Google Sans.',
        },
        {
          name: 'as',
          type: "'h1'…'h6' | 'p' | 'span' | 'div' | 'strong' | 'small' | 'label' | 'legend' | 'figcaption'",
          defaultValue: 'by variant',
          description:
            'The element. Heading styles default to their own level, everything else to p or span.',
        },
        {
          name: 'tone',
          type: "'default' | 'muted' | 'brand' | 'danger'",
          defaultValue: "'default'",
          description: 'Text colour, from the foreground roles.',
        },
        {
          name: '...rest',
          type: 'ComponentProps<as>',
          description:
            'The element’s own props — htmlFor on a label, id, aria-*, ref.',
        },
      ]}
      accessibility={[
        'Choose `as` from the page outline, not the look: one h1 per page, no skipped levels.',
        'A heading style on a p is not a heading to a screen reader — use as="h2" when it is one.',
      ]}
    >
      <StateCell label="Display" hint="Cooper">
        <Text variant="display5" as="p">
          Let’s make it official.
        </Text>
      </StateCell>
      <StateCell label="Heading" hint="Google Sans">
        <Text variant="h6" as="p">
          Your Workspace
        </Text>
      </StateCell>
      <StateCell label="Subtitle and body">
        <div className="flex flex-col gap-1">
          <Text variant="subtitle2">Introduce yourself</Text>
          <Text variant="body2" tone="muted">
            This is how your name will show up in the system.
          </Text>
        </div>
      </StateCell>
      <StateCell label="Caption and overline">
        <div className="flex flex-col gap-1">
          <Text variant="overline" tone="brand">
            New
          </Text>
          <Text variant="caption" tone="muted">
            Sent 2 minutes ago
          </Text>
        </div>
      </StateCell>
      <StateCell label="Tones">
        <Text>Default</Text>
        <Text tone="muted">Muted</Text>
        <Text tone="brand">Brand</Text>
        <Text tone="danger">Danger</Text>
      </StateCell>
      <StateCell label="Every style" hint="Specs on the tokens page">
        <Link href="/ui-showcase/tokens">See the type scale</Link>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TextPreview() {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="display6" as="span">
        Let’s make it official.
      </Text>
      <Text variant="body2" tone="muted">
        Body copy in Google Sans.
      </Text>
    </div>
  );
}
