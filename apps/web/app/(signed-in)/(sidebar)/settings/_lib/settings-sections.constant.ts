import {
  Building2Icon,
  CircleUserRoundIcon,
  HashIcon,
  PaletteIcon,
  UsersIcon,
} from 'lucide-react';
import type {
  SideNavHeading,
  SideNavItem,
} from '@/components/molecules/side-nav';
import { ROUTES } from '@/lib/routes.constant';

/** A section of Settings: always a page, so always somewhere to go. */
export type SettingsSection = Omit<SideNavItem, 'children'> & {
  readonly href: string;
  /** Written by hand beside the section's title, as Home's is: what the page is about, in a few words. */
  readonly note: string;
};

/** What `/settings` shows on a wide screen, so it is also the section marked there. */
export const ACCOUNT_SECTION: SettingsSection = {
  href: ROUTES.settings.account,
  label: 'Account',
  Icon: CircleUserRoundIcon,
  note: "that's you",
};

/**
 * The menu, in order, grouped as the main sidebar groups My Feedback: the person's Account first,
 * then, under a Workspace heading, what belongs to the Workspace they are in, and under Other what
 * belongs to neither, such as how the app looks on this device. A heading holds every item after
 * it until the next one, so Account, under none, comes first.
 */
export const SETTINGS_MENU: readonly (SettingsSection | SideNavHeading)[] = [
  ACCOUNT_SECTION,
  { heading: 'Workspace' },
  {
    href: ROUTES.settings.workspace,
    label: 'General',
    Icon: Building2Icon,
    note: 'where your team meets',
  },
  {
    href: ROUTES.settings.workspaceGoals,
    label: 'Goals',
    Icon: HashIcon,
    note: 'what we stand for',
  },
  {
    href: ROUTES.settings.teammates,
    label: 'Teammates',
    Icon: UsersIcon,
    note: "who's on the team",
  },
  { heading: 'Other' },
  {
    href: ROUTES.settings.appearance,
    label: 'Appearance',
    Icon: PaletteIcon,
    note: 'easy on the eyes',
  },
];

/** The section a path opens; Account for `/settings` itself. */
export function settingsSectionAt(pathname: string): SettingsSection {
  return (
    SETTINGS_MENU.find(
      (entry): entry is SettingsSection =>
        'href' in entry && entry.href === pathname,
    ) ?? ACCOUNT_SECTION
  );
}
