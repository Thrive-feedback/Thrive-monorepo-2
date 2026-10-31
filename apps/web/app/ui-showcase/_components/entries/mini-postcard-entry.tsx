import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { MiniPostcard } from '@/components/atoms/mini-postcard';

export function MiniPostcardEntry() {
  return (
    <ShowcaseEntry
      name="MiniPostcard"
      level="atom"
      origin="thrive"
      source="components/atoms/mini-postcard.tsx"
      summary="A small drawing of a postcard, with lines of writing and the blue THRIVE POST mark. Hovering it gives it a small shake and shows View postcard."
      useFor="The corner of a card that opens a postcard."
      avoidFor="Showing what a postcard says or how it looks: it is the same drawing for every card of a kind."
      usage={`import { MiniPostcard } from '@/components/atoms/mini-postcard';

<MiniPostcard kind="offered" />
<MiniPostcard kind="requested" />`}
      props={[
        {
          name: 'kind',
          type: "'offered' | 'requested'",
          description:
            'One full side, or a side halved as a request and its answer are.',
        },
        {
          name: 'isPopupShown',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Keeps "View postcard" showing without a hover, for this page only.',
        },
      ]}
      accessibility={[
        'A drawing, hidden from screen readers, so whatever holds it names the postcard.',
        'Inside a link named card-link, "View postcard" answers keyboard focus as it answers a hover.',
        'With reduced motion it keeps still, and the popup still shows.',
      ]}
    >
      <StateCell
        label="Offered"
        hint="Hover it: it shakes, and the popup shows."
      >
        <MiniPostcard kind="offered" />
      </StateCell>
      <StateCell
        label="Requested"
        hint="Hover it: it shakes, and the popup shows."
      >
        <MiniPostcard kind="requested" />
      </StateCell>
      <StateCell label="Popup showing">
        <div className="pt-10">
          <MiniPostcard kind="offered" isPopupShown />
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function MiniPostcardPreview() {
  return <MiniPostcard kind="offered" />;
}
