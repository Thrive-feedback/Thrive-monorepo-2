'use client';

import { EllipsisIcon, UserMinusIcon, UserPlusIcon } from 'lucide-react';
import { useOptimistic, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { DeactivateMemberDialog } from '@/app/(signed-in)/(sidebar)/settings/_components/deactivate-member-button';
import { changeMemberRole } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/member-role-actions.service';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { RoleSelect } from '@/components/organisms/role-select';
import type { MemberRole } from '@/lib/session/current-account.type';
import { ReactivateMemberDialog } from './reactivate-member-dialog';
import { RoleBadge } from './role-badge';

type Teammate = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  workspaceName: string;
  accountId: string;
  /** Who it is, which names the controls and every question they ask. */
  name: string;
  memberRole: MemberRole;
};

type ManageTriggerProps = {
  name: string;
  ref: React.Ref<HTMLButtonElement>;
};

/** The quiet round button that opens a teammate's menu, named for who it manages. */
function ManageTrigger({ name, ref }: ManageTriggerProps) {
  return (
    <DropdownMenuTrigger asChild>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        aria-label={`Manage ${name}`}
      >
        <EllipsisIcon aria-hidden="true" className="size-4" />
      </Button>
    </DropdownMenuTrigger>
  );
}

/**
 * Holds the menu's place on a row that has none, such as the person's own, so every Role badge
 * down the list ends on the same line.
 */
function NoMenu() {
  return <span aria-hidden="true" className="size-9 shrink-0" />;
}

export type MemberActionsProps = Teammate & {
  /**
   * The signed-in person's own row: making themselves a Member is asked first, and Deactivate is
   * leaving, asked as it is in General.
   */
  isSelf?: boolean;
  /** The Workspace's only Admin, who cannot be made a Member. */
  isLastAdmin?: boolean;
  /** Whether the menu offers Deactivate: an Admin's, on every row, their own included. */
  canDeactivate?: boolean;
};

type Question =
  | 'demote-self'
  | 'last-admin'
  | 'last-admin-leaving'
  | 'deactivate';

/**
 * An Admin's hold on one active teammate. Their Role is the same select Invite people offers, so
 * a Role reads and changes alike wherever it is chosen; picking one saves it at once, showing it
 * while the change is on its way. Making yourself a Member is asked first, because it takes these
 * controls away from you, and making the only Admin a Member is answered with why it cannot be.
 * Deactivating, rarer and harder to take back, waits in the menu beside it, on the person's own row
 * too, where it is leaving: asked first, or answered with why not when they are the only Admin.
 */
export function MemberActions({
  workspaceId,
  workspaceName,
  accountId,
  name,
  memberRole,
  isSelf = false,
  isLastAdmin = false,
  canDeactivate = false,
}: MemberActionsProps) {
  const [shownRole, showRole] = useOptimistic(memberRole);
  const [isChanging, startChanging] = useTransition();
  const [question, setQuestion] = useState<Question>();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeQuestion = (open: boolean) => !open && setQuestion(undefined);

  function change(next: MemberRole) {
    startChanging(async () => {
      showRole(next);
      const result = await changeMemberRole(workspaceId, accountId, next);
      setQuestion(undefined);
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

  function handleRoleChange(next: MemberRole) {
    if (next === memberRole) {
      return;
    }
    if (next === 'MEMBER' && isLastAdmin) {
      setQuestion('last-admin');
      return;
    }
    if (next === 'MEMBER' && isSelf) {
      setQuestion('demote-self');
      return;
    }
    change(next);
  }

  return (
    <span className="flex items-center gap-2">
      <RoleSelect
        label={isSelf ? 'Your Role' : `${name}'s Role`}
        value={shownRole}
        disabled={isChanging}
        onChange={handleRoleChange}
      />
      {canDeactivate ? (
        <DropdownMenu>
          <ManageTrigger name={name} ref={menuButtonRef} />
          <DropdownMenuContent>
            <DropdownMenuItem
              className="text-status-error data-highlighted:bg-status-error-surface"
              onSelect={() =>
                setQuestion(
                  isSelf && isLastAdmin ? 'last-admin-leaving' : 'deactivate',
                )
              }
            >
              <UserMinusIcon aria-hidden="true" className="size-4" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <NoMenu />
      )}
      <Dialog
        open={question === 'last-admin' || question === 'last-admin-leaving'}
        onOpenChange={closeQuestion}
      >
        <DialogContent
          hasCloseButton={false}
          onCloseAutoFocus={(event) => {
            // Opened from the menu, whose item is gone by then: focus goes back to its button.
            if (question === 'last-admin-leaving' && menuButtonRef.current) {
              event.preventDefault();
              menuButtonRef.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isSelf ? "You're the only Admin" : `${name} is the only Admin`}
            </DialogTitle>
            <DialogDescription>
              {`${workspaceName} always needs at least one Admin. Make someone else an Admin first, then ${
                isSelf ? 'you' : 'they'
              } can ${question === 'last-admin-leaving' ? 'leave' : 'become a Member'}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="primary">Got it</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={question === 'demote-self'} onOpenChange={closeQuestion}>
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
      {canDeactivate && (
        <DeactivateMemberDialog
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          accountId={accountId}
          name={name}
          isSelf={isSelf}
          open={question === 'deactivate'}
          onOpenChange={closeQuestion}
          returnFocusTo={menuButtonRef}
        />
      )}
    </span>
  );
}

/**
 * An Admin's hold on someone who left or was Deactivated: the Role they would come back with, as an
 * outline, and a menu whose one choice brings them back.
 */
export function InactiveMemberActions({
  workspaceId,
  workspaceName,
  accountId,
  name,
  memberRole,
}: Teammate) {
  const [isAsking, setIsAsking] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <span className="flex items-center gap-2">
      <RoleBadge memberRole={memberRole} inactive />
      <DropdownMenu>
        <ManageTrigger name={name} ref={menuButtonRef} />
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setIsAsking(true)}>
            <UserPlusIcon aria-hidden="true" className="size-4" />
            Reactivate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ReactivateMemberDialog
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        accountId={accountId}
        name={name}
        memberRole={memberRole}
        open={isAsking}
        onOpenChange={setIsAsking}
        returnFocusTo={menuButtonRef}
      />
    </span>
  );
}
