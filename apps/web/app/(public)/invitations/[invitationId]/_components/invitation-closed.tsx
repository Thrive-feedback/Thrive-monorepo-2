import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import type {
  ClosedInvitationStatus,
  Invitation,
} from '../_lib/invitation.type';
import { InvitationHeading } from './invitation-heading';

export type InvitationClosedProps = {
  invitation: Invitation;
  status: ClosedInvitationStatus;
  /** Whether someone is signed in, which decides where the way onward leads. */
  isSignedIn: boolean;
};

const CLOSED_REASONS: Readonly<Record<ClosedInvitationStatus, string>> = {
  EXPIRED: 'This invitation has expired.',
  REVOKED: 'This invitation is no longer valid.',
  ACCEPTED: 'This invitation has already been used.',
};

/**
 * An Invitation that can no longer be accepted, said before anyone signs in. A new one is the
 * only way in, so the person is pointed at whoever sent it.
 */
export function InvitationClosed({
  invitation,
  status,
  isSignedIn,
}: InvitationClosedProps) {
  const inviter = invitation.inviterName ?? 'whoever invited you';

  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <InvitationHeading invitation={invitation} />
      <div className="flex flex-col gap-2">
        <Text variant="subtitle-3" as="p">
          {CLOSED_REASONS[status]}
        </Text>
        <Text variant="body-2" tone="muted">
          {status === 'ACCEPTED'
            ? `If it was you who accepted it, you're already in ${invitation.workspaceName}.`
            : `Ask ${inviter} to invite you again.`}
        </Text>
      </div>
      {status === 'ACCEPTED' && (
        <Link href={isSignedIn ? ROUTES.home : ROUTES.signIn}>
          {isSignedIn ? 'Go to Thrive' : 'Sign in to Thrive'}
        </Link>
      )}
    </div>
  );
}
