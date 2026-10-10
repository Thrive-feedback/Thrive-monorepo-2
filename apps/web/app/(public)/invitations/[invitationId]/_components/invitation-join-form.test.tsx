import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AcceptInvitationState } from '../_lib/accept-invitation-state.type';
import type { Invitation } from '../_lib/invitation.type';
import { InvitationJoinForm } from './invitation-join-form';

const INVITATION: Invitation = {
  invitationId: '0199a0f0-0000-7000-8000-000000000001',
  workspaceName: 'Acme',
  inviterName: 'Ann Lee',
  invitedEmailMasked: 's•••@acme.co',
  status: 'PENDING',
};

const acceptInvitation =
  vi.fn<(invitationId: string) => Promise<AcceptInvitationState>>();
const useAnotherGoogleAccount =
  vi.fn<(invitationId: string) => Promise<void>>();
vi.mock('../_lib/invitation-actions.service', () => ({
  acceptInvitation: (invitationId: string) => acceptInvitation(invitationId),
  useAnotherGoogleAccount: (invitationId: string) =>
    useAnotherGoogleAccount(invitationId),
}));

beforeEach(() => {
  acceptInvitation.mockReset();
  useAnotherGoogleAccount.mockReset();
});

function renderForm() {
  render(<InvitationJoinForm invitation={INVITATION} email="nok@acme.co" />);
  return userEvent.setup();
}

describe('InvitationJoinForm', () => {
  it('joins the Invitation when asked, and only then', async () => {
    acceptInvitation.mockResolvedValue({});
    const user = renderForm();

    expect(acceptInvitation).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Join Acme' }));

    expect(acceptInvitation).toHaveBeenCalledWith(INVITATION.invitationId);
  });

  it('tells someone signed in with another address which one the Invitation is for, and offers to switch', async () => {
    acceptInvitation.mockResolvedValue({ refusal: 'notForYou' });
    const user = renderForm();

    await user.click(screen.getByRole('button', { name: 'Join Acme' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "You're signed in as nok@acme.co, but this invitation was sent to s•••@acme.co. Use the Google account it was sent to.",
    );
    expect(
      screen.queryByRole('button', { name: 'Join Acme' }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Use another Google account' }),
    );
    expect(useAnotherGoogleAccount).toHaveBeenCalledWith(
      INVITATION.invitationId,
    );
  });

  it('tells someone already in a Workspace that one is the limit for now', async () => {
    acceptInvitation.mockResolvedValue({ refusal: 'alreadyInAWorkspace' });
    const user = renderForm();

    await user.click(screen.getByRole('button', { name: 'Join Acme' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "You're already in a Workspace on Thrive, and for now each person can be in only one.",
    );
  });

  it('lets the person try again after a failure', async () => {
    acceptInvitation.mockResolvedValue({ refusal: 'failed' });
    const user = renderForm();

    await user.click(screen.getByRole('button', { name: 'Join Acme' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't add you to Acme. Please try again.",
    );
    expect(screen.getByRole('button', { name: 'Join Acme' })).toBeEnabled();
  });
});
