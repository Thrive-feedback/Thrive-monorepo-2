'use client';

import { EllipsisIcon, InfoIcon } from 'lucide-react';
import NextLink from 'next/link';
import { useRef, useState } from 'react';
import { DetailsDialog } from '@/app/(signed-in)/(sidebar)/settings/_components/details-dialog';
import type { WorkspaceMember } from '@/app/(signed-in)/(sidebar)/settings/_lib/workspace-member.type';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { calendarDay } from '@/lib/calendar-day.util';
import { ROUTES } from '@/lib/routes.constant';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';

/** Until they introduce themselves, a name reads as a dash, as their row says it. */
export const NO_NAME = '—';

export type MemberInformationDialogProps = {
  member: WorkspaceMember;
  /** They left or were Deactivated. */
  inactive?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu's own button, which takes focus back once it closes. */
  returnFocusTo: React.RefObject<HTMLElement | null>;
};

/**
 * Everything Settings knows about one teammate, which their row leaves out: both their names, the
 * address they sign in with, their Role, whether they are still in, and when they joined. From it,
 * their Profile, once they have introduced themselves and so have one.
 */
export function MemberInformationDialog({
  member,
  inactive = false,
  open,
  onOpenChange,
  returnFocusTo,
}: MemberInformationDialogProps) {
  return (
    <DetailsDialog
      title={member.name ?? member.email}
      rows={[
        { label: 'Display name', value: member.name ?? NO_NAME },
        { label: 'Full name', value: member.fullName ?? NO_NAME },
        { label: 'Email', value: member.email },
        { label: 'Role', value: ROLE_NAMES[member.role] },
        { label: 'Status', value: inactive ? 'Inactive' : 'Active' },
        { label: 'Joined', value: calendarDay(member.joinedAt) },
      ]}
      open={open}
      onOpenChange={onOpenChange}
      returnFocusTo={returnFocusTo}
    >
      {member.slug !== null && (
        <Button asChild variant="primary">
          <NextLink href={ROUTES.profile(member.slug)}>View profile</NextLink>
        </Button>
      )}
    </DetailsDialog>
  );
}

export type MemberInformationItemProps = {
  /** Opens the information. */
  onSelect: () => void;
};

/** The menu item that opens a teammate's information, first in their menu. */
export function MemberInformationItem({
  onSelect,
}: MemberInformationItemProps) {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      <InfoIcon aria-hidden="true" className="size-4" />
      Information
    </DropdownMenuItem>
  );
}

export type MemberInformationMenuProps = {
  member: WorkspaceMember;
  /** They left or were Deactivated. */
  inactive?: boolean;
};

/**
 * A teammate's menu for someone who cannot manage them: only Information, so every row in the list
 * has the same menu in the same place, whoever reads it.
 */
export function MemberInformationMenu({
  member,
  inactive = false,
}: MemberInformationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const name = member.name ?? member.email;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            aria-label={`More about ${name}`}
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <MemberInformationItem onSelect={() => setIsOpen(true)} />
        </DropdownMenuContent>
      </DropdownMenu>
      <MemberInformationDialog
        member={member}
        inactive={inactive}
        open={isOpen}
        onOpenChange={setIsOpen}
        returnFocusTo={menuButtonRef}
      />
    </>
  );
}
