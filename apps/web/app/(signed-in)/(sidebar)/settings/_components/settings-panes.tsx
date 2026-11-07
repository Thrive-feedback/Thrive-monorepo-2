'use client';

import { usePathname } from 'next/navigation';
import {
  SETTINGS_MENU,
  settingsSectionAt,
} from '@/app/(signed-in)/(sidebar)/settings/_lib/settings-sections.constant';
import { Text } from '@/components/atoms/text';
import { SideNav } from '@/components/molecules/side-nav';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';

export type SettingsPanesProps = {
  children: React.ReactNode;
};

/**
 * The second sidebar beside the main one, the menu of sections, then the open section in a column
 * of at most 960px, roomy enough for a row of people with their Role and actions, yet never so wide
 * that a label and its control are a screen apart. Each section
 * draws its own head (`SettingsSectionHead`), since some carry an action beside their title.
 *
 * On a screen wide enough for three columns (`lg`) the menu and the section sit side by side, and
 * `/settings` shows Account beside the menu. On a narrower one they take turns: `/settings` is the
 * menu alone, and a section hides the menu and offers the way back to it. A client component
 * because which pane shows depends on the current path, which only the browser knows.
 *
 * The menu is a column the width of the main sidebar, divided from the section by a line as the
 * main sidebar is from it, its contents held just below the navbar as the page scrolls
 * (`top-21`, as the main sidebar's).
 */
export function SettingsPanes({ children }: SettingsPanesProps) {
  const pathname = usePathname();
  const atIndex = pathname === ROUTES.settings.index;

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div
        className={cn(
          'border-border-subtle px-3 pt-3 pb-6 lg:w-56 lg:shrink-0 lg:border-r',
          !atIndex && 'max-lg:hidden',
        )}
      >
        <div className="flex flex-col gap-4 lg:sticky lg:top-21">
          <Text variant="subtitle-1" as="p" className="px-3 pt-2">
            Settings
          </Text>
          <SideNav
            label="Settings sections"
            items={SETTINGS_MENU}
            currentHref={settingsSectionAt(pathname).href}
          />
        </div>
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          atIndex && 'max-lg:hidden',
        )}
      >
        <div className="mx-auto flex w-full max-w-240 flex-col gap-6 px-4 pt-8 pb-12 md:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
