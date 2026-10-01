import { Card } from '@/components/atoms/card';
import { InviteTeammatesForm } from './invite-teammates-form';

export function InviteTeammatesCard() {
  return (
    <Card
      title="Invite your teammates"
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <InviteTeammatesForm />
    </Card>
  );
}
