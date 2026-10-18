'use client';

import { AlertDialog } from 'radix-ui';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deactivateMember,
  leaveWorkspace,
} from '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type DeactivateMemberButtonProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  accountId: string;
  /** Who is Deactivated, as Members names them. */
  name: string;
  workspaceName: string;
  /** The signed-in person themselves, for whom Deactivating is leaving. */
  isSelf?: boolean;
  /** Set for the Workspace's only active Admin, who cannot leave. */
  disabled?: boolean;
  /** The id of the text saying why it is disabled, or what it does. */
  describedById?: string;
};

/**
 * Ends someone's access to the Workspace, or the person's own, which is leaving. Asked first,
 * because only an Admin can take it back, and the question says what stays: the Feedback they
 * gave and received, with "(inactive)" after their name. The dialog stays open while the
 * request is in flight, so it cannot be sent twice.
 */
export function DeactivateMemberButton({
  workspaceId,
  accountId,
  name,
  workspaceName,
  isSelf = false,
  disabled = false,
  describedById,
}: DeactivateMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActing, startActing] = useTransition();

  function handleConfirm() {
    startActing(async () => {
      const result = isSelf
        ? await leaveWorkspace(workspaceId, accountId)
        : await deactivateMember(workspaceId, accountId);
      setIsOpen(false);
      if (result.ok) {
        toast.success(`${name} was Deactivated`);
      } else {
        toast.error(result.message);
      }
    });
  }

  const label = isSelf ? 'Leave Workspace' : 'Deactivate';

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger asChild>
        <Button
          variant={isSelf ? 'danger' : 'ghost-danger'}
          size="sm"
          disabled={disabled}
          aria-label={isSelf ? undefined : `Deactivate ${name}`}
          aria-describedby={describedById}
        >
          {label}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0" />
        <AlertDialog.Content className="fixed inset-x-4 top-1/2 mx-auto flex max-w-2xl -translate-y-1/2 flex-col gap-4 rounded-page border border-border-default bg-surface-overlay p-6 shadow-high">
          <AlertDialog.Title asChild>
            <Text as="h2" variant="subtitle-2" className="break-all">
              {isSelf ? `Leave ${workspaceName}?` : `Deactivate ${name}?`}
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <Text variant="body-2" tone="muted">
              {isSelf
                ? `You won't be able to open ${workspaceName} again. The Feedback you gave and received stays, with “(inactive)” after your name.`
                : `They won't be able to open ${workspaceName} any more. The Feedback they gave and received stays, with “(inactive)” after their name, until an Admin Reactivates them.`}
            </Text>
          </AlertDialog.Description>
          <div className="flex flex-wrap justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button disabled={isActing}>
                {isSelf ? `Stay in ${workspaceName}` : 'Keep them'}
              </Button>
            </AlertDialog.Cancel>
            <Button variant="danger" loading={isActing} onClick={handleConfirm}>
              {label}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
