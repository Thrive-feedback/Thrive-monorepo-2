'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deactivateMember,
  leaveWorkspace,
} from '@/app/(signed-in)/(sidebar)/settings/_lib/member-deactivation-actions.service';
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
import { OnlyAdminDialog } from './only-admin-dialog';

type DeactivateTarget = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  accountId: string;
  /** Who is Deactivated, as Teammates names them. */
  name: string;
  workspaceName: string;
  /** The signed-in person themselves, for whom Deactivating is leaving. */
  isSelf?: boolean;
};

export type DeactivateMemberButtonProps = DeactivateTarget & {
  /**
   * The Workspace's only active Admin, who cannot be Deactivated: pressing says why instead of
   * asking.
   */
  isLastAdmin?: boolean;
  /** The id of the text saying what it does. */
  describedById?: string;
};

/**
 * Ends someone's access to the Workspace, or the person's own, which is leaving, from a button of
 * its own, as Leave Workspace does. The question it asks is `DeactivateMemberDialog`'s; for the
 * only Admin it answers with `OnlyAdminDialog` instead, so the button never sits greyed out with no
 * way to learn why.
 */
export function DeactivateMemberButton({
  isLastAdmin = false,
  describedById,
  ...target
}: DeactivateMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSelf = false, name, workspaceName } = target;
  const trigger = (
    <DialogTrigger asChild>
      <Button
        variant={isSelf ? 'danger' : 'ghost-danger'}
        size="sm"
        aria-label={isSelf ? undefined : `Deactivate ${name}`}
        aria-describedby={describedById}
      >
        {isSelf ? 'Leave Workspace' : 'Deactivate'}
      </Button>
    </DialogTrigger>
  );

  if (isLastAdmin) {
    return (
      <OnlyAdminDialog
        name={name}
        workspaceName={workspaceName}
        isSelf={isSelf}
        blocked="leave"
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        {trigger}
      </OnlyAdminDialog>
    );
  }

  return (
    <DeactivateMemberDialog {...target} open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
    </DeactivateMemberDialog>
  );
}

export type DeactivateMemberDialogProps = DeactivateTarget & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What opens it, when something on the page does; a menu item opens it by `open` instead. */
  children?: React.ReactNode;
  /**
   * Where focus goes back to once it closes, when it was opened from a menu whose item is gone by
   * then: the menu's own button. Without it, focus would fall to the page.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * The question before ending someone's access, or the person's own. Asked first, because only an
 * Admin can take it back, and the question says what stays: the Feedback they gave and received,
 * with "(inactive)" after their name. It is the shared `Dialog`, so the page dims behind it as it
 * does behind every other question. The dialog stays open while the request is in flight, so it
 * cannot be sent twice.
 */
export function DeactivateMemberDialog({
  workspaceId,
  accountId,
  name,
  workspaceName,
  isSelf = false,
  open,
  onOpenChange,
  children,
  returnFocusTo,
}: DeactivateMemberDialogProps) {
  const [isActing, startActing] = useTransition();

  function handleConfirm() {
    startActing(async () => {
      const result = isSelf
        ? await leaveWorkspace(workspaceId, accountId)
        : await deactivateMember(workspaceId, accountId);
      onOpenChange(false);
      if (result.ok) {
        toast.success(`${name} was deactivated`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent
        hasCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.current) {
            event.preventDefault();
            returnFocusTo.current.focus();
          }
        }}
      >
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
            {isSelf ? `Leave ${workspaceName}` : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
