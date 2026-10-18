'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { reactivateMember } from '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service';
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
import type { MemberRole } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';

export type ReactivateMemberButtonProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  accountId: string;
  /** Who is Reactivated, as Members names them. */
  name: string;
  /** The Role they had when Deactivated, which they come back with. */
  memberRole: MemberRole;
  workspaceName: string;
};

/**
 * Gives someone Deactivated their access to the Workspace back. Asked first, because it lets them
 * read everything they gave and received there again, and for a former Admin manage everyone. It
 * is the shared `Dialog`, so the page dims behind it as it does behind every other question. The
 * dialog stays open while the request is in flight, so it cannot be sent twice.
 */
export function ReactivateMemberButton({
  workspaceId,
  accountId,
  name,
  memberRole,
  workspaceName,
}: ReactivateMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActing, startActing] = useTransition();

  function handleConfirm() {
    startActing(async () => {
      const result = await reactivateMember(workspaceId, accountId);
      setIsOpen(false);
      if (result.ok) {
        toast.success(`${name} was reactivated`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Reactivate ${name}`}>
          Reactivate
        </Button>
      </DialogTrigger>
      <DialogContent hasCloseButton={false}>
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
