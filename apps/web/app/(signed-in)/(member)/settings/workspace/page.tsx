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
  title: 'Workspace',
  robots: { index: false, follow: false },
};

/**
 * The person's Workspace by name, and who is in it, for every Member, with each Role an Admin
 * can change; and, for Admins, a form to invite more and the Invitations still open — Pending
 * or Expired — to resend or revoke. The lists read their own data, so each fills in when its
 * read returns.
 */
export default async function Workspace() {
  const session = await requireMember();

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Text as="p" variant="label" tone="muted">
          Workspace
        </Text>
        <Text variant="subtitle-1" as="h2">
          {session.membership.workspace.name}
        </Text>
      </div>
      <section className="flex flex-col gap-3">
        <Text as="h3" variant="subtitle-2">
          Members
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
          <Text as="h3" variant="subtitle-2">
            Invite teammates
          </Text>
          <InviteMembersForm />
        </section>
      )}
      {mayManageInvitations(session.membership) && (
        <section className="flex flex-col gap-3">
          <Text as="h3" variant="subtitle-2">
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
