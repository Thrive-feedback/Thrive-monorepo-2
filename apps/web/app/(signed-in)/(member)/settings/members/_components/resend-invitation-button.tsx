'use client';

import { resendInvitation } from '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service';
import { ConfirmInvitationAction } from './confirm-invitation-action';

export type ResendInvitationButtonProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  invitationId: string;
  /** The address it was sent to, which names it in the question and the toast. */
  email: string;
};

/** Sends an Invitation's email again once asked, good for another 7 days. */
export function ResendInvitationButton({
  workspaceId,
  invitationId,
  email,
}: ResendInvitationButtonProps) {
  return (
    <ConfirmInvitationAction
      label="Resend"
      accessibleName={`Resend Invitation to ${email}`}
      question="Resend this Invitation?"
      explanation={`${email} will get a new email, and the Invitation will be good for another 7 days.`}
      cancelLabel="Cancel"
      doneMessage={`Invitation resent to ${email}`}
      triggerVariant="ghost"
      confirmVariant="primary"
      onConfirm={() => resendInvitation(workspaceId, invitationId)}
    />
  );
}
