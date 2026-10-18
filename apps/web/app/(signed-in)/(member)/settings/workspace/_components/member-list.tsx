import {
  mayChangeRoles,
  mayDeactivateOthers,
} from '@/app/(signed-in)/(member)/settings/workspace/_lib/member-role-access.util';
import { readMembers } from '@/app/(signed-in)/(member)/settings/workspace/_lib/members.service';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import { DeactivateMemberButton } from './deactivate-member-button';
import { MemberRoleSelect } from './member-role-select';

export type MemberListProps = {
  membership: CurrentMembership;
  /** The signed-in person, marked in the list so they can find themselves. */
  ownEmail: string;
};

/**
 * Everyone active in the Workspace, one line each: their photo, their name, with a dash until
 * they have introduced themselves, their email and their Role. Someone with no photo, or none
 * that loads, shows their initials, taken from their email until they have a name. An Admin sees
 * each Role as a control and can change anyone's, their own included, except the only Admin's,
 * and can Deactivate anyone else. Leaving is its own row under the list. It reads its own data,
 * so the page renders around it while the read is in flight.
 */
export async function MemberList({ membership, ownEmail }: MemberListProps) {
  const members = await readMembers(membership);
  const canChangeRoles = mayChangeRoles(membership);
  const canDeactivateOthers = mayDeactivateOthers(membership);
  const adminCount = members.filter((member) => member.role === 'ADMIN').length;
  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => {
        const isSelf = member.email === ownEmail;
        const isLastAdmin = member.role === 'ADMIN' && adminCount === 1;
        return (
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
            {canChangeRoles ? (
              <>
                <MemberRoleSelect
                  workspaceId={membership.workspace.id}
                  accountId={member.accountId}
                  name={member.name ?? member.email}
                  memberRole={member.role}
                  isSelf={isSelf}
                  isLastAdmin={isLastAdmin}
                />
                {isSelf && (
                  <Text as="span" variant="body-2">
                    (you)
                  </Text>
                )}
              </>
            ) : (
              <Text as="span" variant="body-2">
                {ROLE_NAMES[member.role]}
                {isSelf && ' (you)'}
              </Text>
            )}
            {!isSelf && canDeactivateOthers && (
              <DeactivateMemberButton
                workspaceId={membership.workspace.id}
                accountId={member.accountId}
                name={member.name ?? member.email}
                workspaceName={membership.workspace.name}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
