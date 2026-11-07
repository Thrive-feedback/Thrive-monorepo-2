import { LinkedAccountList } from '@/app/(signed-in)/(sidebar)/settings/account/_components/linked-account-list';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { SignOutForm } from '@/components/organisms/sign-out-form';
import { CHAT_PROVIDER_LIST } from '@/lib/chat/chat-providers.constant';
import type { MemberAccount } from '@/lib/session/session.service';
import {
  SettingRow,
  SettingRowSkeleton,
  SettingValues,
  SettingValuesSkeleton,
} from './setting-row';
import { SettingsCard } from './settings-card';

const PROFILE = 'Profile';
const LINKED_ACCOUNTS = 'Linked Accounts';
const LINKED_DESCRIPTION =
  'Your own chat accounts, where Thrive can message you.';
const DISPLAY_NAME = 'Display name';
const EMAIL = 'Email';
const SIGN_OUT = 'Sign out';
const SIGN_OUT_DESCRIPTION = 'Sign out of Thrive on this device.';

export type AccountSectionProps = {
  session: MemberAccount;
};

/**
 * The person's own Profile, as the session already knows it — their photo and full name, the
 * name others call them by, and the address they sign in with — then the chat accounts they have
 * linked, and Sign out apart at the end, each group in a card of its own. Read only: the API can
 * create a Profile but not yet change one. What they are in one Workspace, their Role, is in
 * Settings → Workspace, since an Account is the same in every Workspace.
 */
export function AccountSection({ session }: AccountSectionProps) {
  const { profile } = session;

  return (
    <>
      <SettingsCard title={PROFILE}>
        <AvatarName
          name={profile.displayName}
          photoUrl={session.photoUrl}
          className="flex py-4"
        >
          <Text variant="subtitle-3" as="h3">
            {profile.fullName}
          </Text>
        </AvatarName>
        <SettingValues
          rows={[
            { label: DISPLAY_NAME, value: profile.displayName },
            { label: EMAIL, value: session.email },
          ]}
        />
      </SettingsCard>
      <SettingsCard title={LINKED_ACCOUNTS} description={LINKED_DESCRIPTION}>
        <LinkedAccountList />
      </SettingsCard>
      <SettingsCard>
        <SettingRow label={SIGN_OUT} description={SIGN_OUT_DESCRIPTION}>
          <SignOutForm variant="warning" />
        </SettingRow>
      </SettingsCard>
    </>
  );
}

/** `AccountSection` while the session is read: the same cards, with only the person's details in grey. */
export function AccountSectionSkeleton() {
  return (
    <>
      <SettingsCard title={PROFILE}>
        {/* The face and gap of a medium `AvatarName`, so the card keeps its height on arrival. */}
        <div className="flex items-center gap-2 py-4">
          <Skeleton shape="circle" className="size-8" />
          <Skeleton className="w-48 text-subtitle-3" />
        </div>
        <SettingValuesSkeleton labels={[DISPLAY_NAME, EMAIL]} />
      </SettingsCard>
      <SettingsCard title={LINKED_ACCOUNTS} description={LINKED_DESCRIPTION}>
        {CHAT_PROVIDER_LIST.map(({ segment, label }) => (
          <SettingRowSkeleton key={segment} label={label} />
        ))}
      </SettingsCard>
      <SettingsCard>
        <SettingRow label={SIGN_OUT} description={SIGN_OUT_DESCRIPTION}>
          <Skeleton shape="control" className="h-9.5 w-20 rounded-button" />
        </SettingRow>
      </SettingsCard>
    </>
  );
}
