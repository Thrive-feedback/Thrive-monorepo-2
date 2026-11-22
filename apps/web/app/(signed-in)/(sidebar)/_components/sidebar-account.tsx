'use client';

import { SettingsIcon } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { isSettingsPath } from '@/app/(signed-in)/(sidebar)/_lib/settings-path.util';
import { Text } from '@/components/atoms/text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { SideNav } from '@/components/molecules/side-nav';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { useSidebarFold } from '@/lib/use-sidebar-fold';
import { SidebarFoldToggle } from './sidebar-fold-toggle';

export type SidebarAccountProps = {
  /** The name the person goes by: their Profile's display name. */
  name: string;
  email: string;
  /** The slug their Profile is opened by. */
  slug: string;
  /** Their photo from Google; `null` shows their initials. */
  photoUrl: string | null;
};

/**
 * The foot of the sidebar: the button that folds it, Settings, then, under a line, who is signed in,
 * their face, name and address, leading to their Profile. On a phone they stand at the foot of the
 * menu drawer, as the sidebar does there. Settings is marked current on every one of its pages, since they open
 * beside this sidebar with their own menu; the account card is marked on the person's own Profile,
 * and not on anyone else's. Whenever the sidebar is a rail, all of them fold to their icon and face,
 * named by a tooltip, as the rest of the sidebar does. It reads the path itself because the layout
 * around it does not run again when the client navigates between the pages under it.
 */
export function SidebarAccount({
  name,
  email,
  slug,
  photoUrl,
}: SidebarAccountProps) {
  const pathname = usePathname();
  const inSettings = isSettingsPath(pathname);
  const { folded } = useSidebarFold();
  const profileHref = ROUTES.profile(slug);
  const label = `Profile: ${name}, ${email}`;

  const account = (
    <NextLink
      href={profileHref}
      aria-label={label}
      aria-current={pathname === profileHref ? 'page' : undefined}
      className={cn(
        'flex min-w-0 items-center rail:justify-center gap-2.5 rounded-button px-3 rail:px-0 py-2 hover:bg-action-neutral-surface-hover aria-[current]:bg-action-primary-surface',
      )}
    >
      <PhotoAvatar name={name} photoUrl={photoUrl} />
      <span className="flex rail:hidden min-w-0 flex-col">
        <Text as="span" variant="subtitle-4" className="truncate">
          {name}
        </Text>
        <Text as="span" variant="body-3" tone="muted" className="truncate">
          {email}
        </Text>
      </span>
    </NextLink>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <SidebarFoldToggle />
        <SideNav
          label="Settings"
          currentHref={inSettings ? ROUTES.settings.index : undefined}
          items={[
            {
              href: ROUTES.settings.index,
              label: 'Settings',
              Icon: SettingsIcon,
            },
          ]}
          foldsToIcons
        />
      </div>
      {/* Who is signed in stands apart from where to go, under its own line. */}
      <div className="border-border-subtle border-t" />
      {/* The name and address show beside the face while it is wide, so a tooltip names the face
          on the rail only. */}
      {folded ? (
        <Tooltip>
          <TooltipTrigger asChild>{account}</TooltipTrigger>
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
      ) : (
        account
      )}
    </div>
  );
}
