import { readMembers } from '@/app/(signed-in)/(member)/settings/workspace/_lib/members.service';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type DeactivatedMemberListProps = {
  membership: CurrentMembership;
};

/**
 * Everyone who left the Workspace or was Deactivated there, listed apart from those still in it,
 * each with "Deactivated" beside their name. It reads its own data, so the page renders around
 * it while the read is in flight.
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
            {member.name ?? '—'}
          </Text>
          <Text as="span" variant="body-2" tone="muted" className="break-all">
            {member.email}
          </Text>
          <Text as="span" variant="caption" tone="muted">
            Deactivated
          </Text>
        </li>
      ))}
    </ul>
  );
}
