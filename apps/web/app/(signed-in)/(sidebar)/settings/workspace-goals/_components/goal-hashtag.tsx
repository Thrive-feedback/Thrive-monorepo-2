import { hashtagOf } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-name.util';
import { TaggedText } from '@/components/molecules/tagged-text';
import { HASHTAG_RULE } from '@/lib/feedback/text-tag-rules.constant';

export type GoalHashtagProps = {
  /** Without its `#`. */
  name: string;
  /**
   * Hidden from new Feedback, so nothing can tag it: drawn as plain muted text rather than the tag
   * Feedback would show.
   */
  isHidden?: boolean;
};

/**
 * A Workspace Goal's hashtag drawn exactly as a Feedback message draws it — the same `TaggedText`
 * with the same rule — so what Settings shows is what Members will see, and a name Feedback would
 * not read as one tag reads that way here too.
 */
export function GoalHashtag({ name, isHidden = false }: GoalHashtagProps) {
  const hashtag = hashtagOf(name);

  if (isHidden) {
    return <span className="text-fg-secondary">{hashtag}</span>;
  }
  return (
    <TaggedText
      text={hashtag}
      rules={[HASHTAG_RULE]}
      tags={[{ char: '#', value: name, label: hashtag, tone: 'info' }]}
    />
  );
}
