import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import { SettingRow } from '../_components/setting-row';
import { DeactivatedMemberList } from './_components/deactivated-member-list';
import { InvitationList } from './_components/invitation-list';
import { InviteMembersForm } from './_components/invite-members-form';
import { LeaveWorkspaceRow } from './_components/leave-workspace-row';
import { MemberList } from './_components/member-list';
import { WorkspaceSwitcherLoader } from './_components/workspace-switcher-loader';
import { mayManageInvitations } from './_lib/invitation-access.util';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Workspace',
  robots: { index: false, follow: false },
};

/**
 * The Workspace the person is in, by name, with the way to switch to another of theirs or create
 * one; who is in it, for every Member, with each Role an Admin
 * can change and anyone else an Admin can Deactivate; who has left or been Deactivated, apart;
 * for Admins, a form to invite more and the Invitations still open — Pending or Expired — to
 * resend or revoke; and, last, the way to leave. The lists read their own data, so each fills
 * in when its read returns.
 */
export default async function Workspace() {
  const session = await requireMember();

  return (
    <section className="flex flex-col">
      <SettingRow
        label="Workspace"
        description={session.membership.workspace.name}
      >
        <Suspense
          fallback={
            <Button variant="secondary" size="sm" disabled>
              Switch Workspace
            </Button>
          }
        >
          <WorkspaceSwitcherLoader membership={session.membership} />
        </Suspense>
      </SettingRow>
      <section className="flex flex-col gap-3 border-border-subtle border-b py-5">
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
      <section className="flex flex-col gap-3 border-border-subtle border-b py-5">
        <Text as="h3" variant="subtitle-4">
          Deactivated
        </Text>
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <DeactivatedMemberList membership={session.membership} />
        </Suspense>
      </section>
      {mayManageInvitations(session.membership) && (
        <section className="flex flex-col gap-3 border-border-subtle border-b py-5">
          <Text as="h3" variant="subtitle-4">
            Invite teammates
          </Text>
          <InviteMembersForm workspaceId={session.membership.workspace.id} />
        </section>
      )}
      {mayManageInvitations(session.membership) && (
        <section className="flex flex-col gap-3 border-border-subtle border-b py-5">
          <Text as="h3" variant="subtitle-4">
            Open invitations
          </Text>
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <InvitationList membership={session.membership} />
          </Suspense>
        </section>
      )}
      <Suspense fallback={<Skeleton className="my-5 h-10 w-full" />}>
        <LeaveWorkspaceRow
          membership={session.membership}
          ownEmail={session.email}
        />
      </Suspense>
    </section>
  );
}
