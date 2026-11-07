'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { reactivateMember } from '@/app/(signed-in)/(sidebar)/settings/_lib/member-deactivation-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import type { MemberRole } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';

export type ReactivateMemberDialogProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  accountId: string;
  /** Who is Reactivated, as Teammates names them. */
  name: string;
  /** The Role they had when Deactivated, which they come back with. */
  memberRole: MemberRole;
  workspaceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus goes back to once it closes, when it was opened from a menu whose item is gone by
   * then: the menu's own button. Without it, focus would fall to the page.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * The question before bringing back someone who left or was Deactivated, saying what they get back:
 * the Workspace, their old Role, and the Feedback they gave and received there. Opened from a
 * teammate's menu. It stays open while the request is in flight, so it cannot be sent twice.
 */
export function ReactivateMemberDialog({
  workspaceId,
  accountId,
  name,
  memberRole,
  workspaceName,
  open,
  onOpenChange,
  returnFocusTo,
}: ReactivateMemberDialogProps) {
  const [isActing, startActing] = useTransition();

  function handleConfirm() {
    startActing(async () => {
      const result = await reactivateMember(workspaceId, accountId);
      onOpenChange(false);
      if (result.ok) {
        toast.success(`${name} was reactivated`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <DialogTitle className="break-all">Reactivate {name}?</DialogTitle>
          <DialogDescription>
            {`They'll be able to open ${workspaceName} again, as ${
              memberRole === 'ADMIN' ? 'an Admin' : 'a Member'
            }, and read the Feedback they gave and received there.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={isActing}>Cancel</Button>
          </DialogClose>
          <Button variant="primary" loading={isActing} onClick={handleConfirm}>
            Reactivate as {ROLE_NAMES[memberRole]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
