import { LinkedAccountList } from '@/app/(signed-in)/(member)/settings/account/_components/linked-account-list';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { PersonChip } from '@/components/organisms/person-chip';
import { SignOutForm } from '@/components/organisms/sign-out-form';
import type { MemberAccount } from '@/lib/session/session.service';
import {
  SettingRow,
  SettingValues,
  SettingValuesSkeleton,
} from './setting-row';

const DISPLAY_NAME = 'Display name';
const EMAIL = 'Email';
const SIGN_OUT = 'Sign out';
const SIGN_OUT_DESCRIPTION = 'Sign out of Thrive on this device.';

/**
 * The person's own Profile, as the session already knows it — their photo and full name, the
 * name others call them by, and the address they sign in with — and Sign out. Read only: the API
 * can create a Profile but not yet change one. What they are in one Workspace, their Role, is in
 * Settings → Workspace, since an Account is the same in every Workspace.
 */
export function AccountSection({ session }: { session: MemberAccount }) {
  const { profile } = session;

  return (
    <section className="flex flex-col">
      <div className="border-border-subtle border-b py-5">
        {/* The one place a person sees themself by name rather than as "you": this section is
            their own Account, and the name is what it holds. */}
        <Text variant="subtitle-3" as="h3">
          <PersonChip
            person={{
              name: profile.fullName,
              photoUrl: session.photoUrl,
              inactive: false,
              isYou: false,
            }}
            unnamed={profile.displayName}
            size="lg"
          />
        </Text>
      </div>
      <SettingValues
        rows={[
          { label: DISPLAY_NAME, value: profile.displayName },
          { label: EMAIL, value: session.email },
        ]}
      />
      <LinkedAccountList />
      <SettingRow label={SIGN_OUT} description={SIGN_OUT_DESCRIPTION}>
        <SignOutForm />
      </SettingRow>
    </section>
  );
}

/** `AccountSection` while the session is read: the same rows, with only the person's details in grey. */
export function AccountSectionSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 border-border-subtle border-b py-5">
        <Skeleton shape="circle" />
        <Skeleton className="w-48 text-subtitle-3" />
      </div>
      <SettingValuesSkeleton labels={[DISPLAY_NAME, EMAIL]} />
      <SettingRow label={SIGN_OUT} description={SIGN_OUT_DESCRIPTION}>
        <Skeleton shape="control" className="h-9.5 w-20 rounded-button" />
      </SettingRow>
    </div>
  );
}
