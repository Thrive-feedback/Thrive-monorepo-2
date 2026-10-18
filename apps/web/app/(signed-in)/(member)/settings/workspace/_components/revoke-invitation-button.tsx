'use client';

import { revokeInvitation } from '@/app/(signed-in)/(member)/settings/workspace/_lib/invitation-actions.service';
import { ConfirmInvitationAction } from './confirm-invitation-action';

export type RevokeInvitationButtonProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  invitationId: string;
  /** The address it was sent to, which names it in the question and the toast. */
  email: string;
};

/** Revokes an Invitation once asked, because a revoked one cannot be brought back — only a new one sent. */
export function RevokeInvitationButton({
  workspaceId,
  invitationId,
  email,
}: RevokeInvitationButtonProps) {
  return (
    <ConfirmInvitationAction
      label="Revoke"
      accessibleName={`Revoke invitation to ${email}`}
      question="Revoke this invitation?"
      explanation={`${email} won't be able to join with it. You can invite them again later.`}
      cancelLabel="Keep it"
      doneMessage={`Invitation to ${email} revoked`}
      triggerVariant="ghost-danger"
      confirmVariant="danger"
      onConfirm={() => revokeInvitation(workspaceId, invitationId)}
    />
  );
}
