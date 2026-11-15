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
  /** The slug their Profile is opened by; `null` while they have not introduced themselves. */
  slug: string | null;
  /** Their photo from Google; `null` shows their initials. */
  photoUrl: string | null;
};

/**
 * The person's avatar, leading to their Profile, or to their Account in Settings while they have
 * no Profile to open. Pointing at it or focusing it shows the address they are signed in with; the
 * link is named for the person, so the tooltip only adds to that name and touch screens lose
 * nothing.
 */
export function AccountAvatar({
  name,
  email,
  slug,
  photoUrl,
}: AccountAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NextLink
          href={slug === null ? ROUTES.settings.account : ROUTES.profile(slug)}
          aria-label={`${slug === null ? 'Account' : 'Profile'}: ${name}`}
          className="rounded-full"
        >
          <PhotoAvatar name={name} photoUrl={photoUrl} />
        </NextLink>
      </TooltipTrigger>
      <TooltipContent>{email}</TooltipContent>
    </Tooltip>
  );
}
