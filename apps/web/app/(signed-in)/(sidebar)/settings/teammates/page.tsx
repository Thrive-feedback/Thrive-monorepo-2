import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import {
  InvitationList,
  InvitationListSkeleton,
} from './_components/invitation-list';
import { InvitePeople } from './_components/invite-people';
import { MemberList, MemberListSkeleton } from './_components/member-list';
import { MemberListCard } from './_components/member-list-card';
import { mayManageInvitations } from './_lib/invitation-access.util';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Teammates',
  robots: { index: false, follow: false },
};

/**
 * Who is in the person's Workspace, for every Member: themselves first, then everyone else, then
 * those who left or were deactivated; and, for Admins, a form to invite more and the Invitations
 * still open — Pending or Expired — to resend or revoke. Invite people sits at the end of the
 * Members card's title, beside the people it adds to, and opens the form in a dialog. The lists
 * read their own data, so each fills in when its read returns.
 */
export default async function Teammates() {
  const session = await requireMember();
  const { membership } = session;
  const canManageInvitations = mayManageInvitations(membership);

  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.teammates} />
      <MemberListCard
        workspaceName={membership.workspace.name}
        action={
          canManageInvitations && (
            <InvitePeople workspaceId={membership.workspace.id} />
          )
        }
      >
        <Suspense fallback={<MemberListSkeleton />}>
          <MemberList membership={membership} ownEmail={session.email} />
        </Suspense>
      </MemberListCard>
      {canManageInvitations && (
        <SettingsCard
          title="Invitations"
          description="Sent and not yet accepted."
        >
          <Suspense fallback={<InvitationListSkeleton />}>
            <InvitationList membership={membership} />
          </Suspense>
        </SettingsCard>
      )}
    </>
  );
}
