import { Text } from '@/components/atoms/text';
import { FeedbackText } from '@/components/organisms/feedback-text';
import type { HomeFeedRequest } from '@/lib/feedback/home-feed-item.type';
import { AskedPeople } from './asked-people';
import { FeedCardFrame, type FeedCardProps } from './feed-card-frame';
import { FEED_CARD_KIND_INK } from './feed-card-tone.constant';

type QuestionProps = {
  request: HomeFeedRequest;
};

/**
 * What was asked, set apart from the answer as its own plain panel on a light ground, headed "Asked"
 * in the blue of everything asked, the Request message under it cut at two lines. Who asked is the
 * person the card is to, already named above.
 */
function Question({ request }: QuestionProps) {
  return (
    <div className="flex flex-col gap-1 rounded-control bg-surface-base/70 px-3 py-2">
      <Text as="p" variant="overline" className={FEED_CARD_KIND_INK.tertiary}>
        Asked
      </Text>
      <Text as="p" variant="body-2" className="line-clamp-2 break-words">
        <FeedbackText text={request.message} tags={request.messageTags} />
      </Text>
    </div>
  );
}

/**
 * An answer to a Feedback Request, on Home: the same card as Offered Feedback, with the question in
 * a panel of its own above the answer, headed "Asked" and "Answered", so which is which is never a
 * guess; who wrote each is in the line above. Under the answer, everyone the request asked, this
 * card's writer first.
 */
export function RequestedFeedbackCard(props: FeedCardProps) {
  const { item, readerAccountId } = props;

  return (
    <FeedCardFrame {...props}>
      {item.request && <Question request={item.request} />}
      <div className="flex flex-col gap-1">
        {item.request && (
          <Text as="p" variant="overline" tone="muted">
            Answered
          </Text>
        )}
        <Text
          as="p"
          variant="body-1"
          className="whitespace-pre-line break-words"
        >
          <FeedbackText text={item.message} tags={item.messageTags} />
        </Text>
      </div>
      {item.request && (
        <AskedPeople
          request={item.request}
          giverAccountId={item.giver.accountId}
          readerAccountId={readerAccountId}
        />
      )}
    </FeedCardFrame>
  );
}
