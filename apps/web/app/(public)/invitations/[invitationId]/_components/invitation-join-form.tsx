'use client';

import { useActionState } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import type {
  AcceptInvitationRefusal,
  AcceptInvitationState,
} from '../_lib/accept-invitation-state.type';
import type { Invitation } from '../_lib/invitation.type';
import {
  acceptInvitation,
  useAnotherGoogleAccount,
} from '../_lib/invitation-actions.service';

export type InvitationJoinFormProps = {
  invitation: Invitation;
  /** The address the person is signed in with. */
  email: string;
};

function refusalMessage(
  refusal: AcceptInvitationRefusal,
  invitation: Invitation,
  email: string,
): string {
  switch (refusal) {
    case 'notForYou':
      return `You're signed in as ${email}, but this invitation was sent to ${invitation.invitedEmailMasked}. Use the Google account it was sent to.`;
    case 'alreadyInAWorkspace':
      return "You're already in a Workspace on Thrive, and for now each person can be in only one.";
    case 'failed':
      return `We couldn't add you to ${invitation.workspaceName}. Please try again.`;
  }
}

/**
 * A Pending Invitation, opened signed in. Joining takes one deliberate click, so the person
 * sees which account they are about to join with; opening the page never joins by itself.
 * Someone signed in with another address is told so, and offered the way to switch.
 */
export function InvitationJoinForm({
  invitation,
  email,
}: InvitationJoinFormProps) {
  const [state, join, isJoining] = useActionState<AcceptInvitationState>(
    acceptInvitation.bind(null, invitation.invitationId),
    {},
  );
  const isNotForYou = state.refusal === 'notForYou';

  return (
    <div className="flex w-full max-w-110 flex-col items-center gap-4">
      <Text variant="body-2" tone="muted">
        Signed in as{' '}
        <Text
          as="span"
          variant="body-2"
          className="break-all font-medium text-fg-primary"
        >
          {email}
        </Text>
      </Text>
      {state.refusal && (
        <Text role="alert" variant="body-2" tone="danger">
          {refusalMessage(state.refusal, invitation, email)}
        </Text>
      )}
      {!isNotForYou && state.refusal !== 'alreadyInAWorkspace' && (
        <form action={join} className="w-full">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isJoining}
            className="w-full"
          >
            Join {invitation.workspaceName}
          </Button>
        </form>
      )}
      <form
        action={useAnotherGoogleAccount.bind(null, invitation.invitationId)}
        className="w-full"
      >
        <Button
          type="submit"
          variant={isNotForYou ? 'primary' : 'ghost'}
          size={isNotForYou ? 'lg' : 'md'}
          className="w-full"
        >
          Use another Google account
        </Button>
      </form>
    </div>
  );
}
