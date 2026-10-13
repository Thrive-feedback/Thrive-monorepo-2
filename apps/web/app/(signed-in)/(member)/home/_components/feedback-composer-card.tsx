import { readTeammates } from '@/app/(signed-in)/(member)/home/_lib/teammates.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { FeedbackComposer } from './feedback-composer';

export type FeedbackComposerCardProps = {
  membership: CurrentMembership;
  ownEmail: string;
};

/**
 * The top of Home: asking for Feedback or giving it. Reads who can be asked or given to on the
 * server, once, and hands both forms plain data.
 */
export async function FeedbackComposerCard({
  membership,
  ownEmail,
}: FeedbackComposerCardProps) {
  const teammates = await readTeammates(membership, ownEmail);

  return (
    <section
      aria-label="Ask for or give feedback"
      className="flex w-full flex-col rounded-page bg-surface-overlay p-6"
    >
      <FeedbackComposer teammates={teammates} />
    </section>
  );
}
