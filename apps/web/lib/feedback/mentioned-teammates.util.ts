import type { Teammate } from '@/lib/feedback/teammate.type';
import { MENTION_RULE } from '@/lib/feedback/text-tag-rules.constant';
import { segmentsOf, tagKeyOf } from '@/lib/tag-text.util';

/** The teammates the message @mentions, once each, in the order they are first mentioned. */
export function mentionedTeammates(
  message: string,
  teammates: readonly Teammate[],
): Teammate[] {
  const bySlug = new Map(
    teammates.flatMap((teammate) =>
      teammate.slug === null ? [] : [[tagKeyOf(teammate.slug), teammate]],
    ),
  );
  const found = new Map<string, Teammate>();
  for (const segment of segmentsOf(message, [MENTION_RULE])) {
    const teammate = segment.kind === 'tag' ? bySlug.get(segment.key) : null;
    if (teammate) found.set(teammate.accountId, teammate);
  }
  return [...found.values()];
}
