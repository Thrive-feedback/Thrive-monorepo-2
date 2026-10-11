import { Card } from '@/components/atoms/card';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { readTeammates } from '../_lib/teammates.service';
import { RequestFeedbackForm } from './request-feedback-form';

export type RequestFeedbackCardProps = {
  membership: CurrentMembership;
  ownEmail: string;
};

/**
 * Reads who can be asked on the server, in the component that renders it, and hands the form
 * plain data. The read is what can wait, so the page wraps this in its own Suspense boundary.
 */
export async function RequestFeedbackCard({
  membership,
  ownEmail,
}: RequestFeedbackCardProps) {
  const teammates = await readTeammates(membership, ownEmail);

  return (
    <Card
      title="Request feedback"
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <RequestFeedbackForm teammates={teammates} />
    </Card>
  );
}
