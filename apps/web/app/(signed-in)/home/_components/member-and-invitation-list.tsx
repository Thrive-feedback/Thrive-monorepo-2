import type { MemberOrInvitation } from '@/app/(signed-in)/home/_lib/member-or-invitation.type';
import { readMembersAndInvitations } from '@/app/(signed-in)/home/_lib/members-and-invitations.service';
import { ROLE_NAMES } from '@/app/(signed-in)/home/_lib/role-names.constant';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { RevokeInvitationButton } from './revoke-invitation-button';

export type MemberAndInvitationListProps = {
  membership: CurrentMembership;
  /** The signed-in person, who is shown above the list rather than in it. */
  ownEmail: string;
};

const STATUS_NAMES: Readonly<Record<MemberOrInvitation['status'], string>> = {
  JOINED: 'Joined',
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

/**
 * Everyone else in the Workspace, then — for the Owner and Admins — everyone invited and not yet
 * in, one line each: `email | name : role : status`, with `—` where there is no name yet. Each
 * Invitation can be revoked from its line; only those who can revoke are shown Invitations. It
 * reads its own data, so Home renders around it while the read is in flight.
 */
export async function MemberAndInvitationList({
  membership,
  ownEmail,
}: MemberAndInvitationListProps) {
  const people = await readMembersAndInvitations(membership, ownEmail);
  if (people.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        No teammates yet.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {people.map((person) => (
        <li
          key={`${person.status}:${person.email}`}
          className="flex items-center justify-between gap-2"
        >
          <Text as="span" variant="body-2" className="break-all">
            {person.email} | {person.name ?? '—'} : {ROLE_NAMES[person.role]} :{' '}
            {STATUS_NAMES[person.status]}
          </Text>
          {person.invitationId !== null && (
            <RevokeInvitationButton
              invitationId={person.invitationId}
              email={person.email}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
