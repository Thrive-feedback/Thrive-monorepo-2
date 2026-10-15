'use client';

import NextLink from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { ROUTES } from '@/lib/routes.constant';

export type AccountAvatarProps = {
  /** The name the person goes by: their Profile's display name. */
  name: string;
  email: string;
  /** Their photo from Google; `null` shows their initials. */
  photoUrl: string | null;
};

/**
 * The person's avatar, leading to their Account in Settings. Pointing at it or focusing it shows
 * the address they are signed in with; the link is named for the person, so the tooltip only adds
 * to that name and touch screens lose nothing.
 */
export function AccountAvatar({ name, email, photoUrl }: AccountAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NextLink
          href={ROUTES.settings.account}
          aria-label={`Account: ${name}`}
          className="rounded-full"
        >
          <PhotoAvatar name={name} photoUrl={photoUrl} size="md" />
        </NextLink>
      </TooltipTrigger>
      <TooltipContent>{email}</TooltipContent>
    </Tooltip>
  );
}
