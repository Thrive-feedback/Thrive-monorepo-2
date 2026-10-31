import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Postmark } from '@/components/atoms/postmark';

const SAMPLE_DATE = '2026-10-04T09:30:00.000Z';

export function PostmarkEntry() {
  return (
    <ShowcaseEntry
      name="Postmark"
      level="atom"
      origin="thrive"
      source="components/atoms/postmark.tsx"
      summary="The mark of something posted: a round stamp with who posted it curving round its edge and the day in its centre, trailing cancelling waves, in ink."
      useFor="Showing that a card has been sent, as PostcardDialog does as it flies off and PostcardReadDialog does on the card."
      avoidFor="The only place something has to be read: a screen reader never hears it, so say a date that matters beside it too."
      usage={`import { Postmark } from '@/components/atoms/postmark';

<Postmark className="w-48" date="2026-10-04T09:30:00.000Z" />`}
      props={[
        {
          name: 'date',
          type: 'string',
          description:
            'When it was posted, as an ISO date. Its day shows in the centre on two lines, as 04 OCT and 2026, in UTC.',
        },
        {
          name: 'className',
          type: 'string',
          description:
            'Size with w-*: it fills what holds it by default, and keeps its shape.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'svg'>",
          description: 'Any native svg prop.',
        },
      ]}
      accessibility={[
        'Hidden from screen readers, date included: say a date that matters in words beside it.',
      ]}
    >
      <StateCell label="Sizes">
        <Postmark className="w-48" date={SAMPLE_DATE} />
        <Postmark className="w-32" date={SAMPLE_DATE} />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function PostmarkPreview() {
  return <Postmark className="w-32" date={SAMPLE_DATE} />;
}
