import { TaggedText } from '@/components/molecules/tagged-text';
import { TEXT_TAG_RULES } from '@/lib/feedback/text-tag-rules.constant';
import type { TextTags } from '@/lib/feedback/text-tags.type';

export type FeedbackTextProps = {
  /** A Request message or a Feedback message, as it was written. */
  text: string;
  /** What it was bound to when it was sent. */
  tags: TextTags;
};

/**
 * Sent text as every reader sees it: the Workspace Goals it was bound to as pills in the Admin's
 * spelling, the Members it mentioned as pills with the name they went by, and every other `#` or
 * `@` as the plain text written. Inline only, so it takes the type of whatever holds it.
 */
export function FeedbackText({ text, tags }: FeedbackTextProps) {
  return (
    <TaggedText
      text={text}
      rules={TEXT_TAG_RULES}
      tags={[
        ...tags.workspaceGoals.map(({ name }) => ({
          char: '#',
          value: name,
          label: `#${name}`,
          tone: 'accent' as const,
        })),
        ...tags.mentions.map(({ slug, displayName }) => ({
          char: '@',
          value: slug,
          label: `@${displayName}`,
          tone: 'secondary' as const,
        })),
      ]}
    />
  );
}
