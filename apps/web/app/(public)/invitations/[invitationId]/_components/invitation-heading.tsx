import { Text } from '@/components/atoms/text';
import type { Invitation } from '../_lib/invitation.type';

export type InvitationHeadingProps = {
  invitation: Invitation;
};

/** Who invited the person, and to which Workspace, as the email said it. */
export function InvitationHeading({ invitation }: InvitationHeadingProps) {
  return (
    <Text variant="display-5" as="h1" className="md:text-display-3">
      {invitation.inviterName
        ? `${invitation.inviterName} invited you to join ${invitation.workspaceName}`
        : `You've been invited to join ${invitation.workspaceName}`}
    </Text>
  );
}
