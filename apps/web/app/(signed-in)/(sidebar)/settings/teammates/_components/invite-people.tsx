'use client';

import { UserPlusIcon, XIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { Button } from '@/components/atoms/button';
import { ROUTES } from '@/lib/routes.constant';
import { InviteMembersForm } from './invite-members-form';

const INVITE_PEOPLE = 'Invite people';

export type InvitePeopleProps = {
  /** The Workspace the page was drawn for; sending is refused once the person is no longer in it. */
  workspaceId: string;
};

/**
 * Members' head for an Admin, with Invite people beside the title, since inviting is what an Admin
 * mostly comes here for, and the card it opens above everyone already in. Opening sends focus to
 * the card's title, so a screen reader hears where it went; closing gives it back to the button.
 *
 * The form stays mounted while the card is shut, so what was typed is still there when it opens
 * again.
 */
export function InvitePeople({ workspaceId }: InvitePeopleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  function open() {
    setIsOpen(true);
    // The card is drawn on the next frame; focus waits for it.
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  function close() {
    setIsOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <>
      <SettingsSectionHead
        href={ROUTES.settings.teammates}
        action={
          <Button
            ref={toggleRef}
            variant="primary"
            size="sm"
            aria-expanded={isOpen}
            aria-controls={cardId}
            onClick={isOpen ? close : open}
          >
            <UserPlusIcon aria-hidden="true" className="size-4" />
            {INVITE_PEOPLE}
          </Button>
        }
      />
      <div id={cardId} hidden={!isOpen}>
        <SettingsCard
          title={INVITE_PEOPLE}
          description="They get an email with a link to join. An Invitation lasts a week."
          titleRef={titleRef}
          action={
            <Button
              variant="ghost"
              size="sm"
              aria-label="Close Invite people"
              onClick={close}
            >
              <XIcon aria-hidden="true" className="size-4" />
            </Button>
          }
        >
          <div className="py-4">
            <InviteMembersForm workspaceId={workspaceId} />
          </div>
        </SettingsCard>
      </div>
    </>
  );
}
