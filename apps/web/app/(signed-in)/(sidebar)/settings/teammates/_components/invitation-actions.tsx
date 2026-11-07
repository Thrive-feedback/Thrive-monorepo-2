'use client';

import { EllipsisIcon, MailIcon, MailXIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { ResendInvitationDialog } from './resend-invitation-dialog';
import { RevokeInvitationDialog } from './revoke-invitation-dialog';

export type InvitationActionsProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  invitationId: string;
  /** The address it was sent to, which names the menu and every question it asks. */
  email: string;
};

/**
 * An Admin's hold on one open Invitation: one quiet menu, as a teammate's row has, so the list
 * reads as who was invited and where each stands, and its two actions wait until asked for.
 * Resend sends the email again; Revoke, in red, ends it. Each asks first.
 */
export function InvitationActions({
  workspaceId,
  invitationId,
  email,
}: InvitationActionsProps) {
  const [question, setQuestion] = useState<'resend' | 'revoke'>();
  const closeQuestion = (open: boolean) => !open && setQuestion(undefined);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const invitation = {
    workspaceId,
    invitationId,
    email,
    returnFocusTo: menuButtonRef,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            aria-label={`Manage Invitation to ${email}`}
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setQuestion('resend')}>
            <MailIcon aria-hidden="true" className="size-4" />
            Resend
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-status-error-active data-highlighted:bg-status-error-surface"
            onSelect={() => setQuestion('revoke')}
          >
            <MailXIcon aria-hidden="true" className="size-4" />
            Revoke
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResendInvitationDialog
        {...invitation}
        open={question === 'resend'}
        onOpenChange={closeQuestion}
      />
      <RevokeInvitationDialog
        {...invitation}
        open={question === 'revoke'}
        onOpenChange={closeQuestion}
      />
    </>
  );
}
