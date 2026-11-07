import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { readInvitationsWaiting } from '@/lib/session/session.service';

/**
 * One notice for each Invitation waiting for the person, naming the Workspace that sent it, so a
 * missed email still reaches them (brain `ADR-0034` decision 5). Each links to the Invitation's
 * own page, the one its email opens, where they join (`ADR-0035` decision 5). Nothing at all
 * while none is waiting.
 */
export async function InvitationNotices() {
  const invitations = await readInvitationsWaiting();
  if (invitations.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Invitations waiting for you"
      className="flex flex-col gap-2"
    >
      {invitations.map((invitation) => (
        <li
          key={invitation.invitationId}
          className="flex flex-wrap items-center justify-between gap-2 rounded-page bg-surface-raised p-4"
        >
          <Text variant="body-2">
            You&apos;ve been invited to {invitation.workspace.name}
          </Text>
          <Link href={ROUTES.invitation(invitation.invitationId)}>
            See the invitation
          </Link>
        </li>
      ))}
    </ul>
  );
}
