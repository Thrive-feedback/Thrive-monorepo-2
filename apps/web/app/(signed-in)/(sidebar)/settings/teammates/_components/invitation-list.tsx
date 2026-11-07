import { readInvitations } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitations.service';
import type { OpenInvitation } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/open-invitation.type';
import { Skeleton } from '@/components/atoms/skeleton';
import { StatusText, type StatusTone } from '@/components/atoms/status-text';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import { ASK_STATUS_TONES } from '@/lib/feedback/ask-status.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import { InvitationActions } from './invitation-actions';

export type InvitationListProps = {
  membership: CurrentMembership;
};

const STATUS_NAMES: Readonly<Record<OpenInvitation['status'], string>> = {
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

/**
 * Each status in the colour of where it stands, said as a word in the line as an Ask's standing is:
 * still waiting in the yellow of a Pending Ask, lapsed in red. The word carries the same meaning, so
 * nothing depends on seeing the colour.
 */
const STATUS_TONES: Readonly<Record<OpenInvitation['status'], StatusTone>> = {
  PENDING: ASK_STATUS_TONES.PENDING,
  EXPIRED: 'error',
};

/** An expired Invitation says when it lapsed; a Pending one, when it will. */
const EXPIRY_WORDS: Readonly<Record<OpenInvitation['status'], string>> = {
  PENDING: 'expires',
  EXPIRED: 'expired',
};

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second'] as const;

/**
 * Everyone invited and not yet in, newest first: the address, then where it stands, the Role they
 * will join with, who sent it and when, and when it expires, with a menu beside each to Resend or
 * Revoke it. Only for Admins. It reads its own data, so the page renders around it while the read is in
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
        <li
          key={invitation.invitationId}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-border-subtle border-b py-3 last:border-b-0"
        >
          <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
            <Text as="span" variant="subtitle-4" className="break-all">
              {invitation.email}
            </Text>
            <Text as="span" variant="body-3" tone="muted">
              <StatusText tone={STATUS_TONES[invitation.status]}>
                {STATUS_NAMES[invitation.status]}
              </StatusText>{' '}
              · as {ROLE_NAMES[invitation.role]} · sent by{' '}
              {invitation.invitedBy} on{' '}
              <time dateTime={invitation.invitedAt}>
                {calendarDay(invitation.invitedAt)}
              </time>{' '}
              · {EXPIRY_WORDS[invitation.status]}{' '}
              <time dateTime={invitation.expiresAt}>
                {calendarDay(invitation.expiresAt)}
              </time>
            </Text>
          </div>
          <div className="ml-auto flex shrink-0 items-center">
            <InvitationActions
              workspaceId={membership.workspace.id}
              invitationId={invitation.invitationId}
              email={invitation.email}
            />
          </div>
        </li>
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
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-border-subtle border-b py-3 last:border-b-0"
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
