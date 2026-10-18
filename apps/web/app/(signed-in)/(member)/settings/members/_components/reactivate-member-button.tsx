'use client';

import { AlertDialog } from 'radix-ui';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { reactivateMember } from '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
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
 * read everything they gave and received there again, and for a former Admin manage everyone. The
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
        toast.success(`${name} was Reactivated`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Reactivate ${name}`}>
          Reactivate
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0" />
        <AlertDialog.Content className="fixed inset-x-4 top-1/2 mx-auto flex max-w-2xl -translate-y-1/2 flex-col gap-4 rounded-page border border-border-default bg-surface-overlay p-6 shadow-high">
          <AlertDialog.Title asChild>
            <Text as="h2" variant="subtitle-2" className="break-all">
              Reactivate {name}?
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <Text variant="body-2" tone="muted">
              {`They'll be able to open ${workspaceName} again, as ${
                memberRole === 'ADMIN' ? 'an Admin' : 'a Member'
              }, and read the Feedback they gave and received there.`}
            </Text>
          </AlertDialog.Description>
          <div className="flex flex-wrap justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button disabled={isActing}>Not now</Button>
            </AlertDialog.Cancel>
            <Button
              variant="primary"
              loading={isActing}
              onClick={handleConfirm}
            >
              Reactivate as {ROLE_NAMES[memberRole]}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
