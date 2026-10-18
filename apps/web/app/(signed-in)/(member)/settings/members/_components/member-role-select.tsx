'use client';

import { useId, useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { changeMemberRole } from '@/app/(signed-in)/(member)/settings/members/_lib/member-role-actions.service';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Text } from '@/components/atoms/text';
import type { MemberRole } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';

export type MemberRoleSelectProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  accountId: string;
  /** Who the Role belongs to, which names the select for a screen reader. */
  name: string;
  memberRole: MemberRole;
  /** The signed-in person's own row: making themselves a Member is asked first. */
  isSelf?: boolean;
  /** The Workspace's only Admin, who cannot be made a Member. */
  isLastAdmin?: boolean;
};

const LAST_ADMIN_HINT = 'Make someone else an Admin first.';

/**
 * An Admin's control over one person's Role. Picking a Role saves it at once and shows it while
 * the change is on its way. Making yourself a Member is asked first, because it takes these
 * controls away from you. The last Admin's Role cannot be changed, and says why.
 */
export function MemberRoleSelect({
  workspaceId,
  accountId,
  name,
  memberRole,
  isSelf = false,
  isLastAdmin = false,
}: MemberRoleSelectProps) {
  const hintId = useId();
  const [shownRole, showRole] = useOptimistic(memberRole);
  const [isChanging, startChanging] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);

  function change(next: MemberRole) {
    startChanging(async () => {
      showRole(next);
      const result = await changeMemberRole(workspaceId, accountId, next);
      setIsConfirming(false);
      if (result.ok) {
        toast.success(
          isSelf
            ? `You are now ${next === 'ADMIN' ? 'an Admin' : 'a Member'}`
            : `${name} is now ${next === 'ADMIN' ? 'an Admin' : 'a Member'}`,
        );
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleValueChange(value: string) {
    const next = value === 'ADMIN' ? 'ADMIN' : 'MEMBER';
    if (next === memberRole) {
      return;
    }
    if (isSelf && next === 'MEMBER') {
      setIsConfirming(true);
      return;
    }
    change(next);
  }

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Select
        value={shownRole}
        onValueChange={handleValueChange}
        disabled={isLastAdmin || isChanging}
      >
        <SelectTrigger
          aria-label={isSelf ? 'Your Role' : `${name}'s Role`}
          aria-describedby={isLastAdmin ? hintId : undefined}
          className="w-auto py-1.5"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">{ROLE_NAMES.ADMIN}</SelectItem>
          <SelectItem value="MEMBER">{ROLE_NAMES.MEMBER}</SelectItem>
        </SelectContent>
      </Select>
      {isLastAdmin && (
        <Text as="span" id={hintId} variant="caption" tone="muted">
          {LAST_ADMIN_HINT}
        </Text>
      )}
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent hasCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Make yourself a Member?</DialogTitle>
            <DialogDescription>
              You won't be able to invite people or change anyone's Role.
              Another Admin can make you an Admin again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isChanging}>Stay an Admin</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={isChanging}
              onClick={() => change('MEMBER')}
            >
              Make me a Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
}
