import type { Metadata } from 'next';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import { SettingsCategoryList } from './_components/settings-category-list';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

/** The Workspace's settings, one category per page beneath this one. Every Member may come here. */
export default async function Settings() {
  await requireMember();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Text variant="display-5" as="h1">
        Settings
      </Text>
      <SettingsCategoryList />
    </div>
  );
}
