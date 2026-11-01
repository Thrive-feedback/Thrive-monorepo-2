import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { CardCover } from './card-cover';
import { KudosFeedCardDemo } from './kudos-card-demos';
import { KUDOS_CASES, SAMPLE_KUDOS } from './kudos-samples.constant';

export function KudosFeedCardEntry() {
  return (
    <ShowcaseEntry
      name="KudosFeedCard"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/kudos-feed-card.tsx — FeedCardWho + KudosCardReadOnly + KudosCardFace + KudosCardReadDialog"
      summary="One Kudos in Home's feed: who gave it to whom, that it is a Kudos and how long ago, and the whole card in focus on a small board of blurred cards, which a wider screen shows more of. The cursor coming onto the card gives it a little shake. No Reactions yet."
      useFor="One Kudos in the Home menu, between the Feedback."
      avoidFor="/home's feed, which keeps KudosCard. The Kudos board, which hangs cards of its own."
      usage={`import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';

<KudosFeedCard kudos={item} readerAccountId={page.readerAccountId} />`}
      props={[
        {
          name: 'kudos',
          type: 'ReadKudos',
          description:
            'The Kudos to show, as toReadKudos makes it from what the API sends.',
        },
        {
          name: 'readerAccountId',
          type: 'string',
          description:
            'Who is reading, so the card can say "You" and put them first among the Receivers.',
        },
      ]}
      accessibility={[
        'View kudos is the one way in from the keyboard and for a screen reader. Pressing the card does the same for a mouse or a finger.',
        'The blurred cards are decoration, hidden from screen readers.',
        'Reduced motion leaves the card still as the cursor arrives.',
      ]}
    >
      {KUDOS_CASES.map(({ label, kudos }) => (
        <StateCell key={label} label={label} wide>
          <div className="w-full">
            <KudosFeedCardDemo kudos={kudos} />
          </div>
        </StateCell>
      ))}
    </ShowcaseEntry>
  );
}

export function KudosFeedCardPreview() {
  return (
    <CardCover>
      <KudosFeedCardDemo kudos={SAMPLE_KUDOS} />
    </CardCover>
  );
}
