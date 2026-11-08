'use client';

import { EllipsisIcon, InfoIcon, MailIcon, MailXIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { DetailsDialog } from '@/app/(signed-in)/(sidebar)/settings/_components/details-dialog';
import {
  INVITATION_EXPIRY_LABELS,
  INVITATION_STATUS_NAMES,
  INVITATION_STATUS_TONES,
} from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-status.constant';
import type { OpenInvitation } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/open-invitation.type';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { StatusText } from '@/components/atoms/status-text';
import { calendarDay } from '@/lib/calendar-day.util';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import { ResendInvitationDialog } from './resend-invitation-dialog';
import { RevokeInvitationDialog } from './revoke-invitation-dialog';

export type InvitationActionsProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  /** The Invitation, whose address names the menu and every question it asks. */
  invitation: OpenInvitation;
};

/**
 * An Admin's hold on one open Invitation: one quiet menu, as a teammate's row has, so the list
 * reads as who was invited and where each stands. Information shows the rest: the Role they join
 * with, who sent it, when, and when it expires. Resend sends the email again; Revoke, in red, ends
 * it. Each asks first.
 */
export function InvitationActions({
  workspaceId,
  invitation,
}: InvitationActionsProps) {
  const [question, setQuestion] = useState<'details' | 'resend' | 'revoke'>();
  const closeQuestion = (open: boolean) => !open && setQuestion(undefined);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { email, status } = invitation;
  const target = {
    workspaceId,
    invitationId: invitation.invitationId,
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
          <DropdownMenuItem onSelect={() => setQuestion('details')}>
            <InfoIcon aria-hidden="true" className="size-4" />
            Information
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setQuestion('resend')}>
            <MailIcon aria-hidden="true" className="size-4" />
            Resend
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            tone="danger"
            onSelect={() => setQuestion('revoke')}
          >
            <MailXIcon aria-hidden="true" className="size-4" />
            Revoke
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DetailsDialog
        title={email}
        rows={[
          {
            label: 'Status',
            value: (
              <StatusText tone={INVITATION_STATUS_TONES[status]}>
                {INVITATION_STATUS_NAMES[status]}
              </StatusText>
            ),
          },
          { label: 'Joins as', value: ROLE_NAMES[invitation.role] },
          { label: 'Sent by', value: invitation.invitedBy },
          {
            label: 'Sent',
            value: (
              <time dateTime={invitation.invitedAt}>
                {calendarDay(invitation.invitedAt)}
              </time>
            ),
          },
          {
            label: INVITATION_EXPIRY_LABELS[status],
            value: (
              <time dateTime={invitation.expiresAt}>
                {calendarDay(invitation.expiresAt)}
              </time>
            ),
          },
        ]}
        open={question === 'details'}
        onOpenChange={closeQuestion}
        returnFocusTo={menuButtonRef}
      />
      <ResendInvitationDialog
        {...target}
        open={question === 'resend'}
        onOpenChange={closeQuestion}
      />
      <RevokeInvitationDialog
        {...target}
        open={question === 'revoke'}
        onOpenChange={closeQuestion}
      />
    </>
  );
}
