import { readInvitations } from '@/app/(signed-in)/(member)/settings/workspace/_lib/invitations.service';
import type { OpenInvitation } from '@/app/(signed-in)/(member)/settings/workspace/_lib/open-invitation.type';
import { Text } from '@/components/atoms/text';
import { calendarDay } from '@/lib/calendar-day.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import { ResendInvitationButton } from './resend-invitation-button';
import { RevokeInvitationButton } from './revoke-invitation-button';

export type InvitationListProps = {
  membership: CurrentMembership;
};

const STATUS_NAMES: Readonly<Record<OpenInvitation['status'], string>> = {
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

/**
 * Each status in the colour of where it stands: still waiting, or lapsed. The status colour
 * itself, not its `-fg` role, which is near-black text meant for a status surface. The word
 * carries the same meaning, so nothing depends on seeing the colour.
 */
const STATUS_COLOURS: Readonly<Record<OpenInvitation['status'], string>> = {
  PENDING: 'text-status-warning',
  EXPIRED: 'text-status-error',
};

/** An expired Invitation says when it lapsed; a Pending one, when it will. */
const EXPIRY_WORDS: Readonly<Record<OpenInvitation['status'], string>> = {
  PENDING: 'expires',
  EXPIRED: 'expired',
};

/**
 * Everyone invited and not yet in, newest first: the address, the Role they will join with, who
 * sent it and when, when it
 * expires and where it stands, with Resend and Revoke beside each. Only for Admins.
 * It reads its own data, so the page renders around it while the read is in flight.
 */
export async function InvitationList({ membership }: InvitationListProps) {
  const invitations = await readInvitations(membership);
  if (invitations.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        No invitations waiting.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {invitations.map((invitation) => (
        <li
          key={invitation.invitationId}
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <Text as="span" variant="subtitle-4" className="break-all">
              {invitation.email}
            </Text>
            <Text as="span" variant="body-3" tone="muted">
              as {ROLE_NAMES[invitation.role]} · by {invitation.invitedBy} ·
              sent{' '}
              <time dateTime={invitation.invitedAt}>
                {calendarDay(invitation.invitedAt)}
              </time>{' '}
              · {EXPIRY_WORDS[invitation.status]}{' '}
              <time dateTime={invitation.expiresAt}>
                {calendarDay(invitation.expiresAt)}
              </time>
            </Text>
            <Text
              as="span"
              variant="body-3"
              className={STATUS_COLOURS[invitation.status]}
            >
              {STATUS_NAMES[invitation.status]}
            </Text>
          </div>
          <div className="flex gap-2">
            <ResendInvitationButton
              workspaceId={membership.workspace.id}
              invitationId={invitation.invitationId}
              email={invitation.email}
            />
            <RevokeInvitationButton
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
