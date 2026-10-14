'use client';

import NextLink from 'next/link';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { initials } from '@/lib/initials.util';
import { ROUTES } from '@/lib/routes.constant';

export type AccountAvatarProps = {
  /** The name the person goes by: their Profile's display name. */
  name: string;
  email: string;
};

/**
 * The person's avatar, leading to their Account in Settings. Pointing at it or focusing it shows
 * the address they are signed in with; the link is named for the person, so the tooltip only adds
 * to that name and touch screens lose nothing.
 */
export function AccountAvatar({ name, email }: AccountAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NextLink
          href={ROUTES.settings.account}
          aria-label={`Account: ${name}`}
          className="rounded-full"
        >
          <Avatar size="md" aria-hidden="true">
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
        </NextLink>
      </TooltipTrigger>
      <TooltipContent>{email}</TooltipContent>
    </Tooltip>
  );
}
