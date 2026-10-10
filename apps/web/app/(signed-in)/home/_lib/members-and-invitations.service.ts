import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { MemberOrInvitation } from './member-or-invitation.type';

/** A Workspace holds 20–50 people, so one page of the largest size covers it. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/** Only those who can invite are shown the Invitations; the API refuses everyone else. */
function maySeeInvitations(membership: CurrentMembership): boolean {
  return membership.role === 'OWNER' || membership.role === 'ADMIN';
}

/**
 * Everyone in the person's Workspace but themselves, then — for the Owner and Admins — everyone
 * invited and not yet in. Both reads start together, and neither is cached: who is in changes
 * the moment someone accepts.
 */
export async function readMembersAndInvitations(
  membership: CurrentMembership,
  ownEmail: string,
): Promise<MemberOrInvitation[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const params = {
    path: { workspaceId: membership.workspace.id },
    header: { cookie },
    query: ONE_PAGE,
  };
  const [members, invitations] = await Promise.all([
    apiClient().GET('/v1/workspaces/{workspaceId}/members', {
      params,
      cache: 'no-store',
    }),
    maySeeInvitations(membership)
      ? apiClient().GET('/v1/workspaces/{workspaceId}/invitations', {
          params,
          cache: 'no-store',
        })
      : null,
  ]);

  const people: MemberOrInvitation[] = unwrap(members)
    .items.filter((member) => member.email !== ownEmail)
    .map((member) => ({
      email: member.email,
      name: member.fullName,
      role: member.role,
      status: 'JOINED',
    }));
  if (invitations) {
    people.push(
      ...unwrap(invitations).items.map((invitation) => ({
        email: invitation.email,
        name: null,
        role: invitation.role,
        status: invitation.status,
      })),
    );
  }
  return people;
}
