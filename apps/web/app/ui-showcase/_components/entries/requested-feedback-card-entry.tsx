import { ShowcaseEntry } from '@/app/ui-showcase/_components/showcase-entry';
import { MiniPostcard } from '@/components/atoms/mini-postcard';
import { FeedCardCases } from './feed-card-cases';
import { REQUESTED_CASES } from './feed-card-samples.constant';

export function RequestedFeedbackCardEntry() {
  return (
    <ShowcaseEntry
      name="RequestedFeedbackCard"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/requested-feedback-card.tsx — FeedCardFrame + MiniPostcard + FeedbackText"
      summary="An answer to a Feedback Request, in Home's feed: the same card as OfferedFeedbackCard, with what was asked above the answer, who else was asked under it, and a small postcard halved as the real one is."
      useFor="One answer in the Home menu. In a list, use FeedCardList."
      avoidFor="/home's lists, which keep FeedbackCard until that page is replaced. Feedback kept to the person who asked, which is never on Home."
      usage={`import { RequestedFeedbackCard } from '@/components/organisms/feed-card/requested-feedback-card';

<RequestedFeedbackCard
  item={item}
  readerAccountId={page.readerAccountId}
  target={{ href: ROUTES.brandNewHomeFeedback(item.id, show) }}
/>`}
      props={[
        {
          name: 'item',
          type: 'HomeFeedItem',
          description:
            'One answer as the Home feed reads it. Its `request` holds what was asked, who asked it and everyone asked.',
        },
        {
          name: 'readerAccountId',
          type: 'string',
          description:
            'Who is reading, so the card can say "You" and "You asked:".',
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
        'What was asked is read before the answer, in the order the card shows them.',
        'The faces under Also asked are one button that speaks every name. The Show and Read buttons say whether they are open, and each Read button names whose answer it opens.',
        '"View postcard" answers keyboard focus as it answers a hover on the small postcard, which is a drawing, hidden from screen readers.',
      ]}
    >
      <FeedCardCases cases={REQUESTED_CASES} />
    </ShowcaseEntry>
  );
}

export function RequestedFeedbackCardPreview() {
  return <MiniPostcard kind="requested" />;
}
