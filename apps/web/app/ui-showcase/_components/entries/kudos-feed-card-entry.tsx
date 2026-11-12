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
      source="components/organisms/feed-card/kudos-feed-card.tsx — FeedCardColumns + FeedCardWho + FeedCardPreview + KudosCardReadOnly + KudosCardReadDialog"
      summary="One Kudos in Home's feed, drawn as every card in a list is: who gave it to whom, that it is a Kudos and how long ago, and the message cut at three lines, with the card it was written on made small and leaning in the column beside them. No Reactions yet."
      useFor="One Kudos in the Home menu, between the Feedback."
      avoidFor="The Kudos board, which hangs cards of its own."
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
        'The small card is the one button, named "Open kudos from" and who gave it. The card it draws is hidden from screen readers, which read the message beside it.',
        'With reduced motion, the card straightens without turning.',
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
