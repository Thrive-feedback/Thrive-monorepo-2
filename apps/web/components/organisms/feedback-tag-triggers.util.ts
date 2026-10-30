import type { AutocompleteTrigger } from '@/components/molecules/use-tag-autocomplete';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  HASHTAG_RULE,
  MENTION_RULE,
} from '@/lib/feedback/text-tag-rules.constant';

/**
 * What a Member can complete while writing a Request message or a Feedback message: `#` and an active
 * Workspace Goal of their Workspace, by name only, and `@` and a teammate who has introduced
 * themselves, found by any of their names and written by their slug.
 *
 * A Mention only makes the text easier to read. Every teammate is offered, whoever the Feedback
 * is shared with, because naming someone shares nothing with them.
 */
export function feedbackTagTriggers(
  workspaceGoals: readonly string[],
  teammates: readonly Teammate[],
): AutocompleteTrigger[] {
  return [
    {
      rule: HASHTAG_RULE,
      label: 'Workspace Goals',
      tone: 'accent',
      options: workspaceGoals.map((name) => ({
        value: name,
        label: `#${name}`,
        keywords: [name],
      })),
    },
    {
      rule: MENTION_RULE,
      label: 'Teammates',
      tone: 'secondary',
      options: teammates.flatMap(({ name, slug, displayName }) =>
        slug === null
          ? []
          : [
              {
                value: slug,
                label: displayName ?? name,
                keywords: [displayName ?? name, name, slug],
              },
            ],
      ),
    },
  ];
}
