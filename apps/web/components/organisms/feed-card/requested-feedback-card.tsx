import { Text } from '@/components/atoms/text';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonName } from '@/components/organisms/person-name';
import type { HomeFeedRequest } from '@/lib/feedback/home-feed-item.type';
import { AskedPeople } from './asked-people';
import { FeedCardFrame, type FeedCardProps } from './feed-card-frame';
import { NO_NAME_STARTING_A_SENTENCE } from './feed-card-sentence.util';

/** What was asked, over a dashed rule: who asked and the Request message, cut at two lines. */
function Question({
  request,
  readerAccountId,
}: {
  request: HomeFeedRequest;
  readerAccountId: string;
}) {
  return (
    <div className="border-border-muted border-b border-dashed pb-3">
      <Text
        as="p"
        variant="body-3"
        tone="muted"
        className="line-clamp-2 break-words"
      >
        {request.requester.accountId === readerAccountId ? (
          'You'
        ) : (
          <PersonName
            name={request.requester.name ?? NO_NAME_STARTING_A_SENTENCE}
            inactive={request.requester.inactive}
          />
        )}{' '}
        asked:{' '}
        <span className="text-fg-primary">
          <FeedbackText text={request.message} tags={request.messageTags} />
        </span>
      </Text>
    </div>
  );
}

/**
 * An answer to a Feedback Request, on Home: the same card as Offered Feedback, with what was asked
 * above the answer, who else was asked under it, and a small postcard halved as the real one is.
 */
export function RequestedFeedbackCard(props: FeedCardProps) {
  const { item, readerAccountId } = props;

  return (
    <FeedCardFrame {...props}>
      {item.request && (
        <Question request={item.request} readerAccountId={readerAccountId} />
      )}
      <Text as="p" variant="body-1" className="whitespace-pre-line break-words">
        <FeedbackText text={item.message} tags={item.messageTags} />
      </Text>
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
