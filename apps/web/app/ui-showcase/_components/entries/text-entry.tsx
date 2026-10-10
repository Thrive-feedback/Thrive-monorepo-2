import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

const USAGE = `import { Text } from '@/components/atoms/text';

<Text variant="display-3" as="h1">Let’s make it official.</Text>
<Text variant="body-2" tone="muted">May I ask how you would like to be introduced?</Text>

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
      avoidFor="Text inside another atom; atoms use the type utilities (text-body-2…) directly."
      usage={USAGE}
      props={[
        {
          name: 'variant',
          type: "'display-1'…'display-6' | 'h1'…'h6' | 'subtitle-1'…'subtitle-4' | 'subtitle-display-1'…'-4' | 'subtitle-handwrite-1'…'-4' | 'body-1'…'body-3' | 'quote' | 'code' | 'label' | 'caption' | 'overline'",
          defaultValue: "'body-1'",
          description:
            'The blueprint type role. Display, subtitle-display and quote are set in Cooper, subtitle-handwrite in Caveat, code in mono, the rest in Google Sans.',
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
          type: "'default' | 'muted' | 'brand' | 'danger' | 'success' | 'info' | 'warning'",
          defaultValue: "'default'",
          description:
            'Text colour, from the foreground roles; the last four from the status roles.',
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
        <Text variant="display-5" as="p">
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
          <Text variant="subtitle-2">Introduce yourself</Text>
          <Text variant="body-2" tone="muted">
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
        <Text tone="success">Success</Text>
        <Text tone="info">Info</Text>
        <Text tone="warning">Warning</Text>
      </StateCell>
      <StateCell label="Every style" hint="Specs on the tokens page">
        <Link href={ROUTES.uiShowcase.tokens}>See the type scale</Link>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function TextPreview() {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="display-6" as="span">
        Let’s make it official.
      </Text>
      <Text variant="body-2" tone="muted">
        Body copy in Google Sans.
      </Text>
    </div>
  );
}
