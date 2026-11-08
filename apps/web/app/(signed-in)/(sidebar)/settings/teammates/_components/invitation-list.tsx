import { readInvitations } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitations.service';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { InvitationRow } from './invitation-row';

export type InvitationListProps = {
  membership: CurrentMembership;
};

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second'] as const;

/**
 * Everyone invited and not yet in, newest first: the address and where it stands, with a menu
 * beside each to see the rest, Resend or Revoke it. Only for Admins. It reads its own data, so the page renders around it while the read is in
 * flight.
 */
export async function InvitationList({ membership }: InvitationListProps) {
  const invitations = await readInvitations(membership);
  if (invitations.length === 0) {
    return (
      <Text variant="body-2" tone="muted" className="py-4">
        No Invitations waiting.
      </Text>
    );
  }
  return (
    <ul aria-label="Invitations" className="flex flex-col">
      {invitations.map((invitation) => (
        <InvitationRow
          key={invitation.invitationId}
          workspaceId={membership.workspace.id}
          invitation={invitation}
        />
      ))}
    </ul>
  );
}

/** An `InvitationList` still loading: a few rows of address and details, with their two actions. */
export function InvitationListSkeleton() {
  return (
    <div className="flex flex-col">
      {PLACEHOLDERS.map((placeholder) => (
        <div
          key={placeholder}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-border-subtle border-b py-4 last:border-b-0"
        >
          <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
            <Skeleton className="w-48 text-subtitle-4" />
            <Skeleton className="w-3/4 text-body-3" />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Skeleton shape="circle" className="size-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
