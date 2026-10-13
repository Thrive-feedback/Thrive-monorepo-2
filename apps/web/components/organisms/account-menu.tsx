'use client';

import NextLink from 'next/link';
import { startTransition } from 'react';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { initials } from '@/lib/initials.util';
import { ROUTES } from '@/lib/routes.constant';
import { signOut } from '@/lib/session/session-actions.service';

export type AccountMenuProps = {
  /** The name the person goes by: their Profile's display name. */
  name: string;
  email: string;
};

/**
 * The person's avatar, opening what belongs to them: their Profile, the Workspace's Settings,
 * and Sign out. Sign out runs the server action straight from the item, because the menu is
 * drawn outside the page and cannot sit inside a form; the action redirects to sign-in itself.
 */
export function AccountMenu({ name, email }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Account menu for ${name}`}>
        <Avatar size="md" aria-hidden="true">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-body-2 text-fg-primary">{name}</span>
          <span className="break-all">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NextLink href={ROUTES.profile}>Profile</NextLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <NextLink href={ROUTES.settings.index}>Settings</NextLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            startTransition(() => signOut());
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
