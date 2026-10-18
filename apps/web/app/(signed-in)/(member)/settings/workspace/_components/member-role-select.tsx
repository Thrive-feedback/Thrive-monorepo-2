'use client';

import { AlertDialog } from 'radix-ui';
import { useId, useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { changeMemberRole } from '@/app/(signed-in)/(member)/settings/workspace/_lib/member-role-actions.service';
import { Button } from '@/components/atoms/button';
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

const LAST_ADMIN_HINT = 'Make someone else an Admin first';

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
      <AlertDialog.Root open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0" />
          <AlertDialog.Content className="fixed inset-x-4 top-1/2 mx-auto flex max-w-2xl -translate-y-1/2 flex-col gap-4 rounded-page border border-border-default bg-surface-overlay p-6 shadow-high">
            <AlertDialog.Title asChild>
              <Text as="h2" variant="subtitle-2">
                Make yourself a Member?
              </Text>
            </AlertDialog.Title>
            <AlertDialog.Description asChild>
              <Text variant="body-2" tone="muted">
                You won't be able to invite people or change anyone's Role.
                Another Admin can make you an Admin again.
              </Text>
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button disabled={isChanging}>Stay an Admin</Button>
              </AlertDialog.Cancel>
              <Button
                variant="danger"
                loading={isChanging}
                onClick={() => change('MEMBER')}
              >
                Make me a Member
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </span>
  );
}
