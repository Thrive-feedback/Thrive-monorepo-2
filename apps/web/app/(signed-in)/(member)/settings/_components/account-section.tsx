import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Text } from '@/components/atoms/text';
import { SignOutForm } from '@/components/organisms/sign-out-form';
import { initials } from '@/lib/initials.util';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import type { MemberAccount } from '@/lib/session/session.service';

/**
 * The person's own Profile, as the session already knows it — the names they introduced
 * themselves with, the address they sign in with, and their Role — and Sign out. Read only: the
 * API can create a Profile but not yet change one.
 */
export function AccountSection({ session }: { session: MemberAccount }) {
  const { profile, membership } = session;
  const rows: readonly { readonly label: string; readonly value: string }[] = [
    { label: 'Full name', value: profile.fullName },
    { label: 'Display name', value: profile.displayName },
    { label: 'Email', value: session.email },
    { label: 'Role', value: ROLE_NAMES[membership.role] },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar aria-hidden="true">
            <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
          </Avatar>
          <Text variant="subtitle-1" as="h2">
            {profile.displayName}
          </Text>
        </div>
        <SignOutForm />
      </div>
      <dl className="flex flex-col gap-4 rounded-page bg-surface-raised p-6">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <dt className="text-fg-secondary text-label">{row.label}</dt>
            <dd className="break-all text-body-1">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
