import { TaggedText, type TextTag } from '@/components/molecules/tagged-text';
import { TEXT_TAG_RULES } from '@/lib/feedback/text-tag-rules.constant';
import { segmentsOf } from '@/lib/tag-text.util';

export type TopicTextProps = {
  /** A topic as it was written. */
  text: string;
};

/**
 * A topic's words with every `#` and `@` in them drawn as the pills Feedback draws: blue for a
 * hashtag, orange for a mention. A topic is typed freely and keeps no tags, so each one written is
 * drawn as written, rather than only those bound to a Workspace Goal or a Member as Feedback is.
 * Inline only, so it takes the type of whatever holds it.
 */
export function TopicText({ text }: TopicTextProps) {
  const tags: TextTag[] = segmentsOf(text, TEXT_TAG_RULES).flatMap((segment) =>
    segment.kind === 'tag'
      ? [
          {
            char: segment.char,
            value: segment.key,
            label: segment.text,
            tone: segment.char === '#' ? 'info' : 'secondary',
          },
        ]
      : [],
  );
  return <TaggedText text={text} rules={TEXT_TAG_RULES} tags={tags} />;
}
