import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import {
  InvitationList,
  InvitationListSkeleton,
} from './_components/invitation-list';
import { InviteMembersForm } from './_components/invite-members-form';
import { MemberList, MemberListSkeleton } from './_components/member-list';
import { mayManageInvitations } from './_lib/invitation-access.util';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Members',
  robots: { index: false, follow: false },
};

/**
 * Who is in the person's Workspace, for every Member: themselves first, then everyone else, then
 * those who left or were deactivated; and, for Admins, a form to invite more and the Invitations
 * still open — Pending or Expired — to resend or revoke. The pane is already headed Members, so
 * the list needs no heading of its own. The lists read their own data, so each fills in when its
 * read returns.
 */
export default async function Members() {
  const session = await requireMember();
  const canManageInvitations = mayManageInvitations(session.membership);

  return (
    <section className="flex flex-col">
      <Suspense fallback={<MemberListSkeleton />}>
        <MemberList membership={session.membership} ownEmail={session.email} />
      </Suspense>
      {canManageInvitations && (
        <section className="flex flex-col gap-3 border-border-subtle border-t py-5">
          <Text as="h3" variant="subtitle-4">
            Invite people
          </Text>
          <InviteMembersForm workspaceId={session.membership.workspace.id} />
        </section>
      )}
      {canManageInvitations && (
        <section className="flex flex-col gap-3 border-border-subtle border-t py-5">
          <Text as="h3" variant="subtitle-4">
            Invitations
          </Text>
          <Suspense fallback={<InvitationListSkeleton />}>
            <InvitationList membership={session.membership} />
          </Suspense>
        </section>
      )}
    </section>
  );
}
