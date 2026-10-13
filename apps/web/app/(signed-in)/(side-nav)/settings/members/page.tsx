import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import { InvitationList } from './_components/invitation-list';
import { MemberList } from './_components/member-list';
import { mayManageInvitations } from './_lib/invitation-access.util';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Members',
  robots: { index: false, follow: false },
};

/**
 * Who is in the person's Workspace, for every Member; and, for the Owner and Admins, the
 * Invitations still open — Pending or Expired — to resend or revoke. Both read their own data, so each fills in
 * when its read returns.
 */
export default async function Members() {
  const session = await requireMember();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <Text variant="display-5" as="h1">
        Members
      </Text>
      <section className="flex flex-col gap-3">
        <Text as="h2" variant="subtitle-2">
          In {session.membership.workspace.name}
        </Text>
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <MemberList
            membership={session.membership}
            ownEmail={session.email}
          />
        </Suspense>
      </section>
      {mayManageInvitations(session.membership) && (
        <section className="flex flex-col gap-3">
          <Text as="h2" variant="subtitle-2">
            Open invitations
          </Text>
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <InvitationList membership={session.membership} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
