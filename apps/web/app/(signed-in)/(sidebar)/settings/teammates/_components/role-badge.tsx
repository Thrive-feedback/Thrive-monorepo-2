import { Badge } from '@/components/atoms/badge';
import type { MemberRole } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';

export type RoleBadgeProps = {
  memberRole: MemberRole;
  /** Someone who left or was Deactivated: the Role they would come back with, drawn as an outline. */
  inactive?: boolean;
};

/**
 * A teammate's Role at a glance: an Admin in the light primary colour, since it is the Role that
 * can change things, a Member in the quiet neutral one. Someone inactive keeps their Role only as
 * an outline, because they hold it again only if they are reactivated.
 */
export function RoleBadge({ memberRole, inactive = false }: RoleBadgeProps) {
  return (
    <Badge
      size="sm"
      tone={inactive ? 'outline' : memberRole === 'ADMIN' ? 'brand' : 'neutral'}
      className={inactive ? 'text-fg-secondary' : undefined}
    >
      {ROLE_NAMES[memberRole]}
    </Badge>
  );
}
