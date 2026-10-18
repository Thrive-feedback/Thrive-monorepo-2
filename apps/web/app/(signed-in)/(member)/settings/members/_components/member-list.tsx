import { DeactivateMemberButton } from '@/app/(signed-in)/(member)/settings/_components/deactivate-member-button';
import { readMembers } from '@/app/(signed-in)/(member)/settings/_lib/members.service';
import type { WorkspaceMember } from '@/app/(signed-in)/(member)/settings/_lib/workspace-member.type';
import {
  mayChangeRoles,
  mayDeactivateOthers,
  mayReactivate,
} from '@/app/(signed-in)/(member)/settings/members/_lib/member-role-access.util';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { PersonName } from '@/components/organisms/person-name';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import { MemberRoleSelect } from './member-role-select';
import { ReactivateMemberButton } from './reactivate-member-button';

export type MemberListProps = {
  membership: CurrentMembership;
  /** The signed-in person, listed first and marked so they can find themselves. */
  ownEmail: string;
};

/**
 * Everyone in the Workspace, one row each: the signed-in person first, then everyone else active,
 * then everyone who left or was Deactivated, their names grey with "(inactive)". Each row lines up
 * the same way — photo, then name over email, then Role and actions at the end. An Admin sees each
 * active Role as a control and can change anyone's, their own included, except the only Admin's;
 * can Deactivate anyone else; and can Reactivate anyone inactive. Leaving is in Settings →
 * Workspace. It reads its own data, so the page renders around it while the read is in flight.
 */
export async function MemberList({ membership, ownEmail }: MemberListProps) {
  const [active, inactive] = await Promise.all([
    readMembers(membership),
    readMembers(membership, 'DEACTIVATED'),
  ]);
  const canChangeRoles = mayChangeRoles(membership);
  const canDeactivateOthers = mayDeactivateOthers(membership);
  const canReactivate = mayReactivate(membership);
  const adminCount = active.filter((member) => member.role === 'ADMIN').length;
  const ordered = [
    ...active.filter((member) => member.email === ownEmail),
    ...active.filter((member) => member.email !== ownEmail),
  ];

  return (
    <ul aria-label="Members" className="flex flex-col">
      {ordered.map((member) => {
        const isSelf = member.email === ownEmail;
        return (
          <MemberRow key={member.accountId} member={member} isSelf={isSelf}>
            {canChangeRoles ? (
              <MemberRoleSelect
                workspaceId={membership.workspace.id}
                accountId={member.accountId}
                name={member.name ?? member.email}
                memberRole={member.role}
                isSelf={isSelf}
                isLastAdmin={member.role === 'ADMIN' && adminCount === 1}
              />
            ) : (
              <Text as="span" variant="body-2">
                {ROLE_NAMES[member.role]}
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
          </MemberRow>
        );
      })}
      {inactive.map((member) => (
        <MemberRow key={member.accountId} member={member} inactive>
          <Text as="span" variant="body-2" tone="muted">
            {ROLE_NAMES[member.role]}
          </Text>
          {canReactivate && (
            <ReactivateMemberButton
              workspaceId={membership.workspace.id}
              accountId={member.accountId}
              name={member.name ?? member.email}
              memberRole={member.role}
              workspaceName={membership.workspace.name}
            />
          )}
        </MemberRow>
      ))}
    </ul>
  );
}

type MemberRowProps = {
  member: WorkspaceMember;
  isSelf?: boolean;
  inactive?: boolean;
  /** The Role and actions, kept together at the end of the row. */
  children: React.ReactNode;
};

/**
 * One person: a dash until they have introduced themselves, and their initials, taken from their
 * email until they have a name, when they have no photo. On a narrow screen the Role and actions
 * wrap under the name, still aligned to the end.
 */
function MemberRow({
  member,
  isSelf = false,
  inactive = false,
  children,
}: MemberRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-border-subtle border-b py-3 last:border-b-0">
      <PhotoAvatar
        name={member.name ?? member.email}
        photoUrl={member.photoUrl}
        size="sm"
      />
      <div className="flex min-w-0 flex-1 basis-48 flex-col">
        <Text as="span" variant="subtitle-4">
          <PersonName name={member.name ?? '—'} inactive={inactive} />
          {isSelf && (
            <Text as="span" variant="body-2" tone="muted">
              {' '}
              (you)
            </Text>
          )}
        </Text>
        <Text as="span" variant="body-3" tone="muted" className="break-all">
          {member.email}
        </Text>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
    </li>
  );
}
