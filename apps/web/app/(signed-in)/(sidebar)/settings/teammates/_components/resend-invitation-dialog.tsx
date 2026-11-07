'use client';

import { resendInvitation } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-actions.service';
import { ConfirmInvitationAction } from './confirm-invitation-action';

export type ResendInvitationDialogProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  invitationId: string;
  /** The address it was sent to, which names it in the question and the toast. */
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu's button, which focus goes back to once it closes. */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/** Sends an Invitation's email again once asked, good for another 7 days. */
export function ResendInvitationDialog({
  workspaceId,
  invitationId,
  email,
  open,
  onOpenChange,
  returnFocusTo,
}: ResendInvitationDialogProps) {
  return (
    <ConfirmInvitationAction
      label="Resend"
      question="Resend this Invitation?"
      explanation={`${email} will get a new email, and the Invitation will be good for another 7 days.`}
      cancelLabel="Cancel"
      doneMessage={`Invitation resent to ${email}`}
      confirmVariant="primary"
      open={open}
      onOpenChange={onOpenChange}
      returnFocusTo={returnFocusTo}
      onConfirm={() => resendInvitation(workspaceId, invitationId)}
    />
  );
}
