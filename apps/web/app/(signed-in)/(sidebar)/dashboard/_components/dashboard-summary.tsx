import type { MemberAccount } from '@/lib/session/session.service';
import { readMyFeedbackSummaryOrNothing } from '../_lib/feedback-summary.service';
import { FeedbackSummaryCard } from './feedback-summary-card';
import { FeedbackSummaryEmpty } from './feedback-summary-empty';

export type DashboardSummaryProps = {
  session: MemberAccount;
};

/**
 * The summary block, read here so the page renders around it while it is in flight.
 *
 * This is one block of a page rather than the page itself, so a read the API could not answer
 * must not take the rest of it down — it draws the same block as a deployment that cannot write
 * summaries at all, because in both cases there is none to be had and neither is the person's
 * Feedback's fault.
 */
export async function DashboardSummary({ session }: DashboardSummaryProps) {
  const { summary, isAvailable } = await readMyFeedbackSummaryOrNothing(
    session.membership,
  );

  return summary === null ? (
    <FeedbackSummaryEmpty isAvailable={isAvailable} />
  ) : (
    <FeedbackSummaryCard summary={summary} />
  );
}
