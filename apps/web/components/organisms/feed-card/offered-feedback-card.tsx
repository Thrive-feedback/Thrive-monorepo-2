import { Text } from '@/components/atoms/text';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { FeedCardFrame, type FeedCardProps } from './feed-card-frame';

/**
 * Feedback given without being asked, on Home: the Feedback message cut at three lines, because
 * the whole of it is a press away on the postcard.
 */
export function OfferedFeedbackCard(props: FeedCardProps) {
  const { item } = props;

  return (
    <FeedCardFrame {...props}>
      <Text
        as="p"
        variant="body-1"
        className="line-clamp-3 whitespace-pre-line break-words"
      >
        <FeedbackText text={item.message} tags={item.messageTags} />
      </Text>
    </FeedCardFrame>
  );
}
