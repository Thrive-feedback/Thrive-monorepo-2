import { FeedbackText } from '@/components/organisms/feedback-text';
import { cn } from '@/lib/cn.util';
import type { TextTags } from '@/lib/feedback/text-tags.type';
import styles from './postcard.module.css';
import { messageClassName } from './postcard-message-style.util';
import type { PostcardTextStyle } from './postcard-style.constant';

export type PostcardMessageReadOnlyProps = {
  message: string;
  /** What it was bound to when it was sent. */
  tags: TextTags;
  textStyle: PostcardTextStyle;
  /** Writing lines under the text, as on a letter; printed stationery has none. */
  isRuled?: boolean;
};

/**
 * A message as it was sent, set as it was written. It never sizes the card: a long one scrolls
 * inside it, so everything else on the card stays where it was put. A ruled one takes the room of
 * the field it was written in, down to the row kept under it for the count. It can be reached from
 * the keyboard to scroll it, where a browser would not offer that itself.
 */
export function PostcardMessageReadOnly({
  message,
  tags,
  textStyle,
  isRuled = true,
}: PostcardMessageReadOnlyProps) {
  return (
    <p
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling message must be reachable to scroll it from the keyboard.
      tabIndex={0}
      className={cn(
        'flex-1 overflow-y-auto whitespace-pre-wrap contain-size md:min-h-0',
        styles.message,
        messageClassName(textStyle),
        isRuled ? [styles.ruled, 'mb-6 min-h-40'] : 'min-h-24',
      )}
    >
      <FeedbackText text={message} tags={tags} />
    </p>
  );
}
