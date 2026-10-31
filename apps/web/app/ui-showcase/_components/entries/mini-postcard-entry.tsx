import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { MiniPostcard } from '@/components/molecules/mini-postcard';

/** Any day will do: the showcase reaches no Workspace. */
const SENT_ON = '2026-10-31T03:00:00.000Z';

export function MiniPostcardEntry() {
  return (
    <ShowcaseEntry
      name="MiniPostcard"
      level="molecule"
      origin="thrive"
      source="components/molecules/mini-postcard.tsx"
      summary="A small drawing of a postcard, with lines of writing and the postmark of the day it was sent. Hovering it gives it a small shake and shows View postcard."
      useFor="The corner of a card that opens a postcard."
      avoidFor="Showing what a postcard says or how it looks: it is the same drawing for every card of a kind."
      usage={`import { MiniPostcard } from '@/components/molecules/mini-postcard';

<MiniPostcard kind="offered" date={item.givenAt} />
<MiniPostcard kind="requested" date={item.givenAt} />`}
      props={[
        {
          name: 'kind',
          type: "'offered' | 'requested'",
          description:
            'One full side, or a side halved as a request and its answer are.',
        },
        {
          name: 'date',
          type: 'string',
          description: 'When it was sent, as an ISO date, for the postmark.',
        },
        {
          name: 'size',
          type: "'md' | 'lg'",
          defaultValue: "'md'",
          description:
            '`lg` where the postcard is what the card is for, as an Ask waiting to be answered.',
        },
        {
          name: 'isPending',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Fades and pulses it while what it opens is on its way.',
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
        <MiniPostcard kind="offered" date={SENT_ON} />
      </StateCell>
      <StateCell
        label="Requested"
        hint="Hover it: it shakes, and the popup shows."
      >
        <MiniPostcard kind="requested" date={SENT_ON} />
      </StateCell>
      <StateCell label="Large" hint="On a card waiting to be answered.">
        <MiniPostcard kind="requested" date={SENT_ON} size="lg" />
      </StateCell>
      <StateCell label="Popup showing">
        <div className="pt-10">
          <MiniPostcard kind="offered" date={SENT_ON} isPopupShown />
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function MiniPostcardPreview() {
  return <MiniPostcard kind="offered" date={SENT_ON} />;
}
