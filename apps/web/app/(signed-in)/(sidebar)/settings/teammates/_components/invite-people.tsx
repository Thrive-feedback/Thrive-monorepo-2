'use client';

import { UserPlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { InviteMembersForm } from './invite-members-form';

const INVITE_PEOPLE = 'Invite people';

export type InvitePeopleProps = {
  /** The Workspace the page was drawn for; sending is refused once the person is no longer in it. */
  workspaceId: string;
};

/**
 * Invite people, at the end of the Members card's title for an Admin, and the dialog it opens with
 * the form to invite teammates by email.
 *
 * A send that reached everybody closes the dialog, and its toast says how it went. A send where an
 * address could not go out keeps it open, with those addresses still in the form to try again.
 */
export function InvitePeople({ workspaceId }: InvitePeopleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outlined" size="sm" className="shrink-0">
          <UserPlusIcon aria-hidden="true" className="size-4" />
          {INVITE_PEOPLE}
        </Button>
      </DialogTrigger>
      <DialogContent hasCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{INVITE_PEOPLE}</DialogTitle>
          <DialogDescription>
            They get an email with a link to join. An Invitation lasts a week.
          </DialogDescription>
        </DialogHeader>
        <InviteMembersForm
          workspaceId={workspaceId}
          onSent={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
