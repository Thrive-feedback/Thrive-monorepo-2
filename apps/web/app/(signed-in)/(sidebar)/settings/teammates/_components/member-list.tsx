import { readMembers } from '@/app/(signed-in)/(sidebar)/settings/_lib/members.service';
import type { WorkspaceMember } from '@/app/(signed-in)/(sidebar)/settings/_lib/workspace-member.type';
import {
  mayChangeRoles,
  mayDeactivateOthers,
  mayReactivate,
} from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/member-role-access.util';
import { Badge } from '@/components/atoms/badge';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { PersonName } from '@/components/organisms/person-name';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { InactiveMemberActions, MemberActions } from './member-actions';
import { RoleBadge } from './role-badge';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type MemberListProps = {
  membership: CurrentMembership;
  /** The signed-in person, listed first and marked so they can find themselves. */
  ownEmail: string;
};

/**
 * Everyone in the Workspace, one row each: the signed-in person first, marked You, then everyone
 * else active, then, under an Inactive heading, everyone who left or was Deactivated, their names
 * grey with "(inactive)". Each row reads as a person first — face, name over email — with their
 * Role as a badge at the end. An Admin also gets one menu per row: it changes anyone's Role, their
 * own included, except the only Admin's; Deactivates anyone else; and Reactivates anyone inactive.
 * On their own row Deactivate is leaving, as it is in Settings → General. It reads its own data, so the page renders around it while the
 * read is in flight.
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
  const workspace = {
    workspaceId: membership.workspace.id,
    workspaceName: membership.workspace.name,
  };

  return (
    <>
      <ul aria-label="Teammates" className={LIST}>
        {ordered.map((member) => {
          const isSelf = member.email === ownEmail;
          return (
            <MemberRow key={member.accountId} member={member} isSelf={isSelf}>
              {canChangeRoles ? (
                <MemberActions
                  {...workspace}
                  accountId={member.accountId}
                  name={member.name ?? member.email}
                  memberRole={member.role}
                  isSelf={isSelf}
                  isLastAdmin={member.role === 'ADMIN' && adminCount === 1}
                  canDeactivate={canDeactivateOthers}
                />
              ) : (
                <RoleBadge memberRole={member.role} />
              )}
            </MemberRow>
          );
        })}
      </ul>
      {inactive.length > 0 && (
        <section aria-labelledby="inactive-teammates" className="pt-4">
          <h3
            id="inactive-teammates"
            className="text-fg-secondary text-overline uppercase"
          >
            Inactive
          </h3>
          <ul className={LIST}>
            {inactive.map((member) => (
              <MemberRow key={member.accountId} member={member} inactive>
                {canReactivate ? (
                  <InactiveMemberActions
                    {...workspace}
                    accountId={member.accountId}
                    name={member.name ?? member.email}
                    memberRole={member.role}
                  />
                ) : (
                  <RoleBadge memberRole={member.role} inactive />
                )}
              </MemberRow>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** A column of people, a line between each, as Settings divides every card's rows. */
const LIST = 'flex flex-col divide-y divide-border-subtle';

/**
 * One row's height and spacing, shared by the row and its placeholder so nothing moves on arrival:
 * tall enough for an Admin's Role select, so a row with only a badge stands as tall.
 */
const ROW = 'flex min-h-18 items-center gap-3 py-4';

type MemberRowProps = {
  member: WorkspaceMember;
  isSelf?: boolean;
  inactive?: boolean;
  /** The Role, and an Admin's menu, at the end of the row. */
  children: React.ReactNode;
};

/**
 * One person: a dash until they have introduced themselves, and their initials, taken from their
 * email until they have a name, when they have no photo. A long address is cut short rather than
 * pushing the Role off the row; it is in full in its title.
 */
function MemberRow({
  member,
  isSelf = false,
  inactive = false,
  children,
}: MemberRowProps) {
  return (
    <li className={ROW}>
      <AvatarName
        name={member.name ?? member.email}
        photoUrl={member.photoUrl}
        className="flex min-w-0 flex-1"
      >
        <div className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <Text as="span" variant="subtitle-4" className="truncate">
              <PersonName name={member.name ?? '—'} inactive={inactive} />
            </Text>
            {isSelf && (
              <Badge size="sm" tone="outline">
                You
              </Badge>
            )}
          </span>
          <Text
            as="span"
            variant="body-3"
            tone="muted"
            className="truncate"
            title={member.email}
          >
            {member.email}
          </Text>
        </div>
      </AvatarName>
      <div className="flex shrink-0 items-center">{children}</div>
    </li>
  );
}

/** A `MemberList` still loading: a few rows of face, name over email, and Role. */
export function MemberListSkeleton() {
  return (
    <div className={LIST}>
      {PLACEHOLDERS.map((placeholder) => (
        <div key={placeholder} className={ROW}>
          <Skeleton shape="circle" className="size-8" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Skeleton className="w-32 text-subtitle-4" />
            <Skeleton className="w-48 text-body-3" />
          </div>
          <Skeleton shape="control" className="h-11 w-32 rounded-input" />
        </div>
      ))}
    </div>
  );
}
