import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Badge } from '@/components/atoms/badge';

export function BadgeEntry() {
  return (
    <ShowcaseEntry
      name="Badge"
      level="atom"
      origin="shadcn"
      source="components/atoms/badge.tsx — Badge, badgeVariants"
      summary="A short label that marks or sorts the thing beside it."
      useFor="A state, a level, a category or a count next to the thing it describes."
      avoidFor="Anything a person clicks to act (Button) or removes (a tag in a field)."
      usage={`import { Badge } from '@/components/atoms/badge';

<Badge>Draft</Badge>
<Badge tone="success">Answered</Badge>
<Badge tone="brand">#ownership</Badge>

// A link that looks like a badge, and stays a link.
<Badge asChild tone="outline">
  <Link href="/settings/workspace-goals">3 goals</Link>
</Badge>`}
      props={[
        {
          name: 'tone',
          type: "'neutral' | 'brand' | 'highlight' | 'success' | 'warning' | 'error' | 'info' | 'outline'",
          defaultValue: "'neutral'",
          description:
            'What the label means. Each tone is a surface and a foreground from the tokens.',
        },
        {
          name: 'asChild',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Paint the badge onto its only child, such as a link.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'span'>",
          description: 'Any native span prop.',
        },
      ]}
      accessibility={[
        'Read as its words. A tone adds colour, never meaning on its own, so the words must say it.',
        'Not focusable unless it is painted onto a link or button with asChild.',
      ]}
    >
      <StateCell label="Tones">
        <Badge>Neutral</Badge>
        <Badge tone="brand">Brand</Badge>
        <Badge tone="highlight">Highlight</Badge>
        <Badge tone="outline">Outline</Badge>
      </StateCell>
      <StateCell label="Status">
        <Badge tone="success">Answered</Badge>
        <Badge tone="warning">Waiting</Badge>
        <Badge tone="error">Withdrawn</Badge>
        <Badge tone="info">Shared</Badge>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function BadgePreview() {
  return (
    <>
      <Badge tone="brand">Brand</Badge>
      <Badge tone="success">Answered</Badge>
      <Badge tone="outline">Outline</Badge>
    </>
  );
}
