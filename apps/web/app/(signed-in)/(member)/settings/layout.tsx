import { SettingsPanes } from './_components/settings-panes';

/**
 * Every Settings section, beside the menu that picks one. The check is in each page, not here,
 * because a layout does not run again when the client navigates between the pages under it.
 */
export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SettingsPanes>{children}</SettingsPanes>;
}
