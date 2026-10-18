import { Card } from '@/components/atoms/card';
import { InviteTeammatesForm } from './invite-teammates-form';

export type InviteTeammatesCardProps = {
  /** The Workspace just created, which the invitations are for. */
  workspaceId: string;
};

export function InviteTeammatesCard({ workspaceId }: InviteTeammatesCardProps) {
  return (
    <Card
      title="Invite your teammates"
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <InviteTeammatesForm workspaceId={workspaceId} />
    </Card>
  );
}
