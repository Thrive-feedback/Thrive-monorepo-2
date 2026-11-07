'use client';

import { revokeInvitation } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-actions.service';
import { ConfirmInvitationAction } from './confirm-invitation-action';

export type RevokeInvitationDialogProps = {
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

/** Revokes an Invitation once asked, because a revoked one cannot be brought back — only a new one sent. */
export function RevokeInvitationDialog({
  workspaceId,
  invitationId,
  email,
  open,
  onOpenChange,
  returnFocusTo,
}: RevokeInvitationDialogProps) {
  return (
    <ConfirmInvitationAction
      label="Revoke"
      question="Revoke this Invitation?"
      explanation={`${email} won't be able to join with it. You can invite them again later.`}
      cancelLabel="Keep Invitation"
      doneMessage={`Invitation to ${email} revoked`}
      confirmVariant="danger"
      open={open}
      onOpenChange={onOpenChange}
      returnFocusTo={returnFocusTo}
      onConfirm={() => revokeInvitation(workspaceId, invitationId)}
    />
  );
}
