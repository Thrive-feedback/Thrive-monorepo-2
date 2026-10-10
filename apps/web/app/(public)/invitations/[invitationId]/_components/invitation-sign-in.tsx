import { Text } from '@/components/atoms/text';
import { GoogleSignInButton } from '@/components/molecules/google-sign-in-button';
import type { Invitation } from '../_lib/invitation.type';
import { signInToAccept } from '../_lib/invitation-actions.service';
import { InvitationHeading } from './invitation-heading';

export type InvitationSignInProps = {
  invitation: Invitation;
};

/**
 * A Pending Invitation, opened signed out. Names the address it was sent to, so the person
 * picks the matching Google account the first time.
 */
export function InvitationSignIn({ invitation }: InvitationSignInProps) {
  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-3">
        <InvitationHeading invitation={invitation} />
        <Text variant="body-2" tone="muted">
          Continue with the Google account for{' '}
          <Text
            as="span"
            variant="body-2"
            className="font-medium text-fg-primary"
          >
            {invitation.invitedEmailMasked}
          </Text>
          , the address this invitation was sent to.
        </Text>
      </div>
      <form
        action={signInToAccept.bind(null, invitation.invitationId)}
        className="w-full max-w-110"
      >
        <GoogleSignInButton type="submit" />
      </form>
    </div>
  );
}
