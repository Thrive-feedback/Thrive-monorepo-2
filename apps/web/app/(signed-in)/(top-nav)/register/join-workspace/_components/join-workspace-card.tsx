import { toInvitationChoice } from '@/app/(signed-in)/(top-nav)/register/join-workspace/_lib/invitation-choice.util';
import { Card } from '@/components/atoms/card';
import type { PendingInvitations } from '@/lib/session/pending-invitation.type';
import { JoinWorkspaceForm } from './join-workspace-form';

export type JoinWorkspaceCardProps = {
  invitations: PendingInvitations;
};

export function JoinWorkspaceCard({ invitations }: JoinWorkspaceCardProps) {
  const now = new Date();
  const choices = invitations.map((invitation) =>
    toInvitationChoice(invitation, now),
  );
  return (
    <Card
      title="You were invited"
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <JoinWorkspaceForm choices={choices} />
    </Card>
  );
}
