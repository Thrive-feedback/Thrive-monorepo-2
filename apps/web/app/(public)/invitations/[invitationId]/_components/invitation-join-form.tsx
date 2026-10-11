'use client';

import Image from 'next/image';
import { startTransition, useActionState, useEffect, useRef } from 'react';
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
  /**
   * The person chose to join by signing in with Google and has just come back, so the form
   * joins for them at once instead of asking again.
   */
  joinOnArrival?: boolean;
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
 * A Pending Invitation, opened signed in. Arriving by a link, joining takes one deliberate
 * click, so the person sees which account they are about to join with. Coming back from the
 * Google sign-in they started here, it joins at once: that click was the choice. Someone signed
 * in with another address is told so, and offered the way to switch.
 */
export function InvitationJoinForm({
  invitation,
  email,
  joinOnArrival = false,
}: InvitationJoinFormProps) {
  const [state, join, isJoining] = useActionState<AcceptInvitationState>(
    acceptInvitation.bind(null, invitation.invitationId),
    {},
  );
  const isNotForYou = state.refusal === 'notForYou';

  // Once per arrival: React runs an effect twice in development, and joining twice would only
  // ask the API the same question again.
  const hasJoinedOnArrival = useRef(false);
  useEffect(() => {
    if (!joinOnArrival || hasJoinedOnArrival.current) {
      return;
    }
    hasJoinedOnArrival.current = true;
    startTransition(join);
  }, [joinOnArrival, join]);

  return (
    <div className="flex w-full max-w-110 flex-col items-center gap-4">
      <Text variant="body-2" tone="muted">
        Signed in as{' '}
        <Text
          as="span"
          variant="body-2"
          className="break-all font-medium text-action-secondary"
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
            Join “{invitation.workspaceName}”
          </Button>
        </form>
      )}
      <form
        action={useAnotherGoogleAccount.bind(null, invitation.invitationId)}
        className="w-full"
      >
        <Button
          type="submit"
          variant={isNotForYou ? 'secondary' : 'ghost'}
          size={isNotForYou ? 'lg' : 'md'}
          className="w-full"
          prefixIcon={
            <Image
              src="/brand/google-g.svg"
              alt=""
              width={20}
              height={20}
              className="size-5"
            />
          }
        >
          Use another Google account
        </Button>
      </form>
    </div>
  );
}
