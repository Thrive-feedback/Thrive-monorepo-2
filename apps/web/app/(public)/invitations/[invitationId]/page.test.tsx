import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Invitation } from './_lib/invitation.type';
import InvitationPage from './page';

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';

const PENDING: Invitation = {
  invitationId: INVITATION_ID,
  workspaceName: 'Acme',
  inviterName: 'Ann',
  invitedEmailMasked: 'som•••@acme.co',
  status: 'PENDING',
};

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound');
  }),
}));

const readInvitation = vi.fn<(id: string) => Promise<Invitation | null>>();
vi.mock('./_lib/invitation.service', () => ({
  readInvitation: (id: string) => readInvitation(id),
}));

const readSession = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  readSession: () => readSession(),
}));

const hasJoinIntentFor = vi.fn<(id: string) => Promise<boolean>>();
vi.mock('./_lib/join-intent.service', () => ({
  hasJoinIntentFor: (id: string) => hasJoinIntentFor(id),
}));

const acceptInvitation = vi.fn();
vi.mock('./_lib/invitation-actions.service', () => ({
  acceptInvitation: (id: string) => acceptInvitation(id),
  signInToAccept: vi.fn(),
  useAnotherGoogleAccount: vi.fn(),
}));

vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ message }: { message: string }) => (
    <output>{`toast: ${message}`}</output>
  ),
}));

beforeEach(() => {
  readInvitation.mockReset();
  readSession.mockReset();
  acceptInvitation.mockReset().mockResolvedValue({});
  hasJoinIntentFor.mockReset().mockResolvedValue(false);
});

function open(invitationId = INVITATION_ID, signedIn?: string) {
  return InvitationPage({
    params: Promise.resolve({ invitationId }),
    searchParams: Promise.resolve(signedIn ? { signedIn } : {}),
  });
}

describe('InvitationPage', () => {
  it('names the inviter and the Workspace, and offers Google sign-in to someone signed out', async () => {
    readInvitation.mockResolvedValue(PENDING);
    readSession.mockResolvedValue(null);

    render(await open());

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '“Ann” invited you to join “Acme” workspace',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Do you want to join?')).toBeInTheDocument();
    expect(screen.getByText('“Acme”')).toHaveClass('text-fg-accent');
    expect(screen.getByText('som•••@acme.co')).toHaveClass(
      'text-action-secondary',
    );
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeInTheDocument();
  });

  it('offers to join, as the signed-in account, once someone is signed in', async () => {
    readInvitation.mockResolvedValue(PENDING);
    readSession.mockResolvedValue({ email: 'somchai@acme.co' });

    render(await open());

    expect(screen.getByText('somchai@acme.co')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Join “Acme”' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Continue with Google' }),
    ).not.toBeInTheDocument();
  });

  it('says once that Google signed the person in', async () => {
    readInvitation.mockResolvedValue(PENDING);
    readSession.mockResolvedValue({ email: 'somchai@acme.co' });

    render(await open(INVITATION_ID, '1'));

    expect(
      screen.getByText('toast: Signed in as somchai@acme.co'),
    ).toBeInTheDocument();
  });

  it('names the Workspace alone when the inviter has not introduced themselves', async () => {
    readInvitation.mockResolvedValue({ ...PENDING, inviterName: null });
    readSession.mockResolvedValue(null);

    render(await open());

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: "You've been invited to join “Acme” workspace",
      }),
    ).toBeInTheDocument();
  });

  it('says an expired Invitation has expired, before anyone signs in', async () => {
    readInvitation.mockResolvedValue({ ...PENDING, status: 'EXPIRED' });
    readSession.mockResolvedValue(null);

    render(await open());

    expect(
      screen.getByText('This invitation has expired.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ask Ann to invite you again.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says a revoked Invitation is no longer valid', async () => {
    readInvitation.mockResolvedValue({ ...PENDING, status: 'REVOKED' });
    readSession.mockResolvedValue({ email: 'somchai@acme.co' });

    render(await open());

    expect(screen.getByText('This invitation is no longer valid.')).toHaveClass(
      'text-status-error',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says a used Invitation was used, and leads a signed-in person on to Thrive', async () => {
    readInvitation.mockResolvedValue({ ...PENDING, status: 'ACCEPTED' });
    readSession.mockResolvedValue({ email: 'somchai@acme.co' });

    render(await open());

    expect(
      screen.getByText('This invitation has already been used.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Thrive' })).toHaveAttribute(
      'href',
      '/home',
    );
  });

  it('answers not found for an id no Invitation has', async () => {
    readInvitation.mockResolvedValue(null);
    readSession.mockResolvedValue(null);

    await expect(open()).rejects.toThrow('notFound');
  });

  it('answers not found for a link that carries no Invitation id', async () => {
    await expect(open('not-an-id')).rejects.toThrow('notFound');
    expect(readInvitation).not.toHaveBeenCalled();
  });

  it('joins at once for someone back from the Google sign-in they started here', async () => {
    readInvitation.mockResolvedValue(PENDING);
    readSession.mockResolvedValue({ email: 'somchai@acme.co' });
    hasJoinIntentFor.mockResolvedValue(true);

    render(await open(INVITATION_ID, '1'));

    expect(hasJoinIntentFor).toHaveBeenCalledWith(INVITATION_ID);
    await waitFor(() => {
      expect(acceptInvitation).toHaveBeenCalledWith(INVITATION_ID);
    });
  });

  it('never joins from a link alone, signedIn or not, without that intent', async () => {
    readInvitation.mockResolvedValue(PENDING);
    readSession.mockResolvedValue({ email: 'somchai@acme.co' });

    render(await open(INVITATION_ID, '1'));

    expect(
      await screen.findByRole('button', { name: 'Join “Acme”' }),
    ).toBeEnabled();
    expect(acceptInvitation).not.toHaveBeenCalled();
  });
});
