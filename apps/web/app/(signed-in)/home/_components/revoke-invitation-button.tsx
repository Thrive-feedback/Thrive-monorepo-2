'use client';

import { AlertDialog } from 'radix-ui';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { revokeInvitation } from '@/app/(signed-in)/home/_lib/invitation-actions.service';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type RevokeInvitationButtonProps = {
  invitationId: string;
  /** The address it was sent to, which names it in the question and the toast. */
  email: string;
};

/**
 * Asks before revoking, because a revoked Invitation cannot be brought back — only a new one
 * sent. The dialog stays open while the revoke is in flight and closes once it has answered;
 * the answer is a toast. Radix keeps focus inside the dialog and hands it back to the button.
 */
export function RevokeInvitationButton({
  invitationId,
  email,
}: RevokeInvitationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRevoking, startRevoking] = useTransition();

  function handleRevoke() {
    startRevoking(async () => {
      const result = await revokeInvitation(invitationId);
      setIsOpen(false);
      if (result.ok) {
        toast.success(`Invitation to ${email} revoked`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger asChild>
        <Button
          variant="ghost-danger"
          size="sm"
          aria-label={`Revoke invitation to ${email}`}
        >
          Revoke
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0" />
        <AlertDialog.Content className="fixed inset-x-4 top-1/2 mx-auto flex max-w-md -translate-y-1/2 flex-col gap-4 rounded-page border border-border-default bg-surface-overlay p-6 shadow-high">
          <AlertDialog.Title asChild>
            <Text as="h2" variant="subtitle-2">
              Revoke this invitation?
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <Text variant="body-2" tone="muted" className="break-all">
              {email} won't be able to join with it. You can invite them again
              later.
            </Text>
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button disabled={isRevoking}>Keep it</Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              loading={isRevoking}
              onClick={handleRevoke}
            >
              Revoke
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
