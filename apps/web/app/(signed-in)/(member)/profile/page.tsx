import type { Metadata } from 'next';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Text } from '@/components/atoms/text';
import { initials } from '@/lib/initials.util';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import { requireMember } from '@/lib/session/session.service';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

/**
 * The person's own Profile, as the session already knows it: the names they introduced
 * themselves with, the address they sign in with, and where they belong. Read only — the API
 * can create a Profile but not yet change one.
 */
export default async function ProfilePage() {
  const session = await requireMember();
  const { profile, membership } = session;
  const rows: readonly { readonly label: string; readonly value: string }[] = [
    { label: 'Full name', value: profile.fullName },
    { label: 'Display name', value: profile.displayName },
    { label: 'Email', value: session.email },
    { label: 'Workspace', value: membership.workspace.name },
    { label: 'Role', value: ROLE_NAMES[membership.role] },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar aria-hidden="true">
          <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
        </Avatar>
        <Text variant="display-5" as="h1">
          {profile.displayName}
        </Text>
      </div>
      <dl className="flex flex-col gap-4 rounded-page bg-surface-raised p-6">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <dt className="text-fg-secondary text-label">{row.label}</dt>
            <dd className="break-all text-body-1">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
