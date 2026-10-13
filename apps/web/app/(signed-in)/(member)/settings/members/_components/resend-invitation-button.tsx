'use client';

import { resendInvitation } from '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service';
import { ConfirmInvitationAction } from './confirm-invitation-action';

export type ResendInvitationButtonProps = {
  invitationId: string;
  /** The address it was sent to, which names it in the question and the toast. */
  email: string;
};

/** Sends an Invitation's email again once asked, good for another 7 days. */
export function ResendInvitationButton({
  invitationId,
  email,
}: ResendInvitationButtonProps) {
  return (
    <ConfirmInvitationAction
      label="Resend"
      accessibleName={`Resend invitation to ${email}`}
      question="Send this invitation again?"
      explanation={`${email} will get a new email, and the invitation will be good for another 7 days.`}
      cancelLabel="Not now"
      doneMessage={`Invitation sent again to ${email}`}
      triggerVariant="ghost"
      confirmVariant="primary"
      onConfirm={() => resendInvitation(invitationId)}
    />
  );
}
