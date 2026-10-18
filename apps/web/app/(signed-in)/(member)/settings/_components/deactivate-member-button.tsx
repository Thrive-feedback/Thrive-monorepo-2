'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deactivateMember,
  leaveWorkspace,
} from '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';

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
 * gave and received, with "(inactive)" after their name. It is the shared `Dialog`, so the page
 * dims behind it as it does behind every other question. The dialog stays open while the
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
        toast.success(`${name} was deactivated`);
      } else {
        toast.error(result.message);
      }
    });
  }

  const label = isSelf ? 'Leave Workspace' : 'Deactivate';
  const confirmLabel = isSelf ? `Leave ${workspaceName}` : 'Deactivate';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isSelf ? 'danger' : 'ghost-danger'}
          size="sm"
          disabled={disabled}
          aria-label={isSelf ? undefined : `Deactivate ${name}`}
          aria-describedby={describedById}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent hasCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="break-all">
            {isSelf ? `Leave ${workspaceName}?` : `Deactivate ${name}?`}
          </DialogTitle>
          <DialogDescription>
            {isSelf
              ? `You won't be able to open ${workspaceName} again. The Feedback you gave and received stays, with “(inactive)” after your name.`
              : `They won't be able to open ${workspaceName} any more. The Feedback they gave and received stays, with “(inactive)” after their name, until an Admin reactivates them.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={isActing}>
              {isSelf ? `Stay in ${workspaceName}` : `Keep ${name}`}
            </Button>
          </DialogClose>
          <Button variant="danger" loading={isActing} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
