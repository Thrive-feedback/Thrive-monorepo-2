import { readMembers } from '@/app/(signed-in)/(member)/settings/workspace/_lib/members.service';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';

export type MemberListProps = {
  membership: CurrentMembership;
  /** The signed-in person, marked in the list so they can find themselves. */
  ownEmail: string;
};

/**
 * Everyone in the Workspace, one line each: their name, with a dash until they have introduced
 * themselves, their email and their Role. It reads its own data, so the page renders around it
 * while the read is in flight.
 */
export async function MemberList({ membership, ownEmail }: MemberListProps) {
  const members = await readMembers(membership);
  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => (
        <li
          key={member.accountId}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
        >
          <Text as="span" variant="subtitle-4">
            {member.name ?? '—'}
          </Text>
          <Text as="span" variant="body-2" tone="muted" className="break-all">
            {member.email}
          </Text>
          <Text as="span" variant="body-2">
            {ROLE_NAMES[member.role]}
            {member.email === ownEmail && ' (you)'}
          </Text>
        </li>
      ))}
    </ul>
  );
}
