import { ShowcaseEntry } from '@/app/ui-showcase/_components/showcase-entry';
import { RequestedFeedbackCard } from '@/components/organisms/feed-card/requested-feedback-card';
import { CardCover } from './card-cover';
import { FeedCardCases } from './feed-card-cases';
import {
  REQUESTED_CASES,
  SAMPLE_READER,
  SAMPLE_REQUESTED,
  SAMPLE_TARGET,
} from './feed-card-samples.constant';

export function RequestedFeedbackCardEntry() {
  return (
    <ShowcaseEntry
      name="RequestedFeedbackCard"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/requested-feedback-card.tsx — FeedCardFrame (FeedCardColumns + FeedCardPreview) + FeedbackText"
      summary="An answer to a Feedback Request, in Home's feed: the same card as OfferedFeedbackCard, with what was asked in a panel above the answer, headed Asked and Answered, everyone asked under it (this answer first), and a small postcard halved as the real one is."
      useFor="One answer in the Home menu."
      avoidFor="The landing page's preview of Home, which keeps FeedbackCard. Feedback kept to the person who asked, which is never on Home."
      usage={`import { RequestedFeedbackCard } from '@/components/organisms/feed-card/requested-feedback-card';

<RequestedFeedbackCard
  item={item}
  readerAccountId={page.readerAccountId}
  target={{ href: ROUTES.homeFeedback(item.id, show) }}
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
          description: 'Who is reading, so the card can say "You".',
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
        'The faces under Asked are one button that speaks every name. The Show and Read buttons say whether they are open, and each Read button names whose answer it opens.',
        'The small postcard is a drawing, hidden from screen readers, and straightens under keyboard focus as it does under the cursor.',
      ]}
    >
      <FeedCardCases cases={REQUESTED_CASES} />
    </ShowcaseEntry>
  );
}

export function RequestedFeedbackCardPreview() {
  return (
    <CardCover>
      <RequestedFeedbackCard
        item={SAMPLE_REQUESTED}
        readerAccountId={SAMPLE_READER}
        target={SAMPLE_TARGET}
      />
    </CardCover>
  );
}
