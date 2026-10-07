import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Card } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';

export function CardEntry() {
  return (
    <ShowcaseEntry
      name="Card"
      level="atom"
      origin="thrive"
      source="components/atoms/card.tsx"
      summary="A floating panel with its title in a divided header."
      useFor="The one panel a step lives in: sign-in, introduce yourself."
      avoidFor="Grouping inside a page that is already a card."
      usage={`import { Card } from '@/components/atoms/card';

<Card title="Welcome to Thrive" className="max-w-110">
  …
</Card>`}
      props={[
        {
          name: 'title',
          type: 'string',
          description: 'The heading. Required.',
        },
        {
          name: 'titleAs',
          type: "'h1' | 'h2'",
          defaultValue: "'h1'",
          description: 'h1 when the card is the page; h2 under a page heading.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'section'>",
          description: 'className sets its width.',
        },
      ]}
      accessibility={[
        'The title is a real heading, so the card shows up in heading navigation.',
      ]}
    >
      <StateCell label="Default">
        <Card title="Welcome to Thrive" titleAs="h2">
          <p className="text-body-2 text-fg-secondary">Body content</p>
        </Card>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function CardPreview() {
  return (
    <Card title="Welcome" titleAs="h2" className="w-40">
      <Skeleton />
    </Card>
  );
}
