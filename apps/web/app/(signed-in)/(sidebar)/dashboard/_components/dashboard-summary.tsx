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
 * A read that the API could not answer draws the same block as one it answered with nothing:
 * there is nothing here either way, and this is one block of a page rather than the page itself,
 * so a failure here must not take the rest of it down.
 */
export async function DashboardSummary({ session }: DashboardSummaryProps) {
  const summary = await readMyFeedbackSummaryOrNothing(session.membership);

  return summary === null ? (
    <FeedbackSummaryEmpty />
  ) : (
    <FeedbackSummaryCard summary={summary} />
  );
}
