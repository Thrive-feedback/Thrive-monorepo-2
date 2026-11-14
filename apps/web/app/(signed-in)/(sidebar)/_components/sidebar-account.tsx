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

export type SidebarAccountProps = {
  /** The name the person goes by: their Profile's display name. */
  name: string;
  email: string;
  /** Their photo from Google; `null` shows their initials. */
  photoUrl: string | null;
};

/**
 * The foot of the sidebar: Settings, then, under a line, who is signed in, their face, name and
 * address, leading to their Account. The navbar draws these instead on a phone, where there is no
 * sidebar. Settings is marked current on every one of its pages, since they open beside this
 * sidebar with their own menu; the account card is never marked. In Settings, below `xl`, both
 * fold to their icon and face, named by a tooltip, as the rest of the sidebar does. It reads the
 * path itself because the layout around it does not run again when the client navigates between
 * the pages under it.
 */
export function SidebarAccount({ name, email, photoUrl }: SidebarAccountProps) {
  const pathname = usePathname();
  const inSettings = isSettingsPath(pathname);
  const label = `Account: ${name}, ${email}`;

  const account = (
    <NextLink
      href={ROUTES.settings.account}
      aria-label={label}
      className={cn(
        'flex min-w-0 items-center gap-2.5 rounded-button px-3 py-2 hover:bg-action-neutral-surface-hover',
        inSettings && 'max-xl:justify-center max-xl:px-0',
      )}
    >
      <PhotoAvatar name={name} photoUrl={photoUrl} />
      <span
        className={cn('flex min-w-0 flex-col', inSettings && 'max-xl:hidden')}
      >
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
        foldsToIcons={inSettings}
      />
      {/* Who is signed in stands apart from where to go, under its own line. */}
      <div className="border-border-subtle border-t" />
      {inSettings ? (
        <Tooltip>
          <TooltipTrigger asChild>{account}</TooltipTrigger>
          <TooltipContent side="right" className="xl:hidden">
            {name}
          </TooltipContent>
        </Tooltip>
      ) : (
        account
      )}
    </div>
  );
}
