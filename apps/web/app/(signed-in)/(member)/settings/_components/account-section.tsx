import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { SignOutForm } from '@/components/organisms/sign-out-form';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import type { MemberAccount } from '@/lib/session/session.service';
import { SettingRow, SettingValues } from './setting-row';

/**
 * The person's own Profile, as the session already knows it — their photo, the names they
 * introduced themselves with, the address they sign in with, and their Role — and Sign out. Read only: the
 * API can create a Profile but not yet change one.
 */
export function AccountSection({ session }: { session: MemberAccount }) {
  const { profile, membership } = session;

  return (
    <section className="flex flex-col">
      <div className="flex items-center gap-4 border-border-subtle border-b py-5">
        <PhotoAvatar name={profile.displayName} photoUrl={session.photoUrl} />
        <Text variant="subtitle-3" as="h3">
          {profile.displayName}
        </Text>
      </div>
      <SettingValues
        rows={[
          { label: 'Full name', value: profile.fullName },
          { label: 'Display name', value: profile.displayName },
          { label: 'Email', value: session.email },
          { label: 'Role', value: ROLE_NAMES[membership.role] },
        ]}
      />
      <SettingRow
        label="Sign out"
        description="Sign out of Thrive on this device."
      >
        <SignOutForm />
      </SettingRow>
    </section>
  );
}
