import { mayReactivate } from '@/app/(signed-in)/(member)/settings/workspace/_lib/member-role-access.util';
import { readMembers } from '@/app/(signed-in)/(member)/settings/workspace/_lib/members.service';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { PersonName } from '@/components/organisms/person-name';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ReactivateMemberButton } from './reactivate-member-button';

export type DeactivatedMemberListProps = {
  membership: CurrentMembership;
};

/**
 * Everyone who left the Workspace or was Deactivated there, listed apart from those still in it,
 * each named as inactive, and each with Reactivate for an Admin. It reads its own data, so the
 * page renders around it while the read is in flight.
 */
export async function DeactivatedMemberList({
  membership,
}: DeactivatedMemberListProps) {
  const members = await readMembers(membership, 'DEACTIVATED');
  if (members.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        Nobody has left or been Deactivated.
      </Text>
    );
  }
  const canReactivate = mayReactivate(membership);
  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => (
        <li
          key={member.accountId}
          className="flex flex-wrap items-center gap-x-3 gap-y-1"
        >
          <PhotoAvatar
            name={member.name ?? member.email}
            photoUrl={member.photoUrl}
            size="sm"
          />
          <Text as="span" variant="subtitle-4">
            <PersonName name={member.name ?? '—'} inactive />
          </Text>
          <Text as="span" variant="body-2" tone="muted" className="break-all">
            {member.email}
          </Text>
          {canReactivate && (
            <ReactivateMemberButton
              accountId={member.accountId}
              name={member.name ?? member.email}
              memberRole={member.role}
              workspaceName={membership.workspace.name}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
