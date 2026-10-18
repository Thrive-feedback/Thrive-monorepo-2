import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import { InvitationList } from './_components/invitation-list';
import { InviteMembersForm } from './_components/invite-members-form';
import { MemberList } from './_components/member-list';
import { mayManageInvitations } from './_lib/invitation-access.util';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Members',
  robots: { index: false, follow: false },
};

/**
 * Who is in the person's Workspace, for every Member: themselves first, then everyone else, then
 * those who left or were Deactivated; and, for Admins, a form to invite more and the Invitations
 * still open — Pending or Expired — to resend or revoke. The lists read their own data, so each
 * fills in when its read returns.
 */
export default async function Members() {
  const session = await requireMember();
  const canManageInvitations = mayManageInvitations(session.membership);

  return (
    <section className="flex flex-col">
      <section className="flex flex-col gap-2 border-border-subtle border-b py-5">
        <Text as="h3" variant="subtitle-4">
          Members
        </Text>
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <MemberList
            membership={session.membership}
            ownEmail={session.email}
          />
        </Suspense>
      </section>
      {canManageInvitations && (
        <section className="flex flex-col gap-3 border-border-subtle border-b py-5">
          <Text as="h3" variant="subtitle-4">
            Invite teammates
          </Text>
          <InviteMembersForm workspaceId={session.membership.workspace.id} />
        </section>
      )}
      {canManageInvitations && (
        <section className="flex flex-col gap-3 py-5">
          <Text as="h3" variant="subtitle-4">
            Open invitations
          </Text>
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <InvitationList membership={session.membership} />
          </Suspense>
        </section>
      )}
    </section>
  );
}
