import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { MiniPostcard } from '@/components/atoms/mini-postcard';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { FeedCardCases } from './feed-card-cases';
import { OFFERED_CASES } from './feed-card-samples.constant';

export function OfferedFeedbackCardEntry() {
  return (
    <ShowcaseEntry
      name="OfferedFeedbackCard"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/offered-feedback-card.tsx — FeedCardFrame + MiniPostcard + FeedbackText"
      summary="Feedback given without being asked, in Home's feed: who wrote to whom, how it came about, the day and who can read it, the message cut at three lines, and a small postcard in the corner, which opens the postcard."
      useFor="One piece of Offered Feedback in the Home menu. In a list, use FeedCardList."
      avoidFor="The whole message, which the postcard shows. /home's lists, which keep FeedbackCard until that page is replaced."
      usage={`import { OfferedFeedbackCard } from '@/components/organisms/feed-card/offered-feedback-card';

<OfferedFeedbackCard
  item={item}
  readerAccountId={page.readerAccountId}
  target={{ href: ROUTES.brandNewHomeFeedback(item.id, show) }}
/>`}
      props={[
        {
          name: 'item',
          type: 'HomeFeedItem',
          description:
            'One piece of Feedback as the Home feed reads it, with who can read it.',
        },
        {
          name: 'readerAccountId',
          type: 'string',
          description:
            'Who is reading, so the card can say "You" and put them first among the Receivers.',
        },
        {
          name: 'target',
          type: 'NavTarget',
          description:
            'What pressing the small postcard does: an address or a callback.',
        },
      ]}
      accessibility={[
        'The small postcard is the one link on the card, named "Open postcard:" and who wrote to whom.',
        '"View postcard" answers keyboard focus as it answers a hover on the small postcard, which is a drawing, hidden from screen readers.',
        'Who can read it is words beside an icon, never the icon alone.',
      ]}
    >
      <FeedCardCases cases={OFFERED_CASES} />
      <StateCell label="Loading" wide>
        <div className="w-full max-w-180">
          <FeedCardSkeleton />
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function OfferedFeedbackCardPreview() {
  return <MiniPostcard kind="offered" />;
}
