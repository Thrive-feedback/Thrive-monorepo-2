import { readTeammates } from '@/app/(signed-in)/(side-nav)/home/_lib/teammates.service';
import { Card } from '@/components/atoms/card';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { RequestFeedbackForm } from './request-feedback-form';

export type RequestFeedbackCardProps = {
  membership: CurrentMembership;
  ownEmail: string;
};

/** Reads who can be asked on the server and hands the form plain data. */
export async function RequestFeedbackCard({
  membership,
  ownEmail,
}: RequestFeedbackCardProps) {
  const teammates = await readTeammates(membership, ownEmail);

  return (
    <Card title="Request feedback" titleAs="h2">
      <RequestFeedbackForm teammates={teammates} />
    </Card>
  );
}
