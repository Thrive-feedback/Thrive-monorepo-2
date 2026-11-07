import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/atoms/card';
import { InviteTeammatesForm } from './invite-teammates-form';

export type InviteTeammatesCardProps = {
  /** The Workspace just created, which the invitations are for. */
  workspaceId: string;
};

export function InviteTeammatesCard({ workspaceId }: InviteTeammatesCardProps) {
  return (
    <Card className="max-w-110 justify-self-center md:justify-self-end">
      <CardHeader>
        <CardTitle as="h2">Invite your teammates</CardTitle>
      </CardHeader>
      <CardContent>
        <InviteTeammatesForm workspaceId={workspaceId} />
      </CardContent>
    </Card>
  );
}
