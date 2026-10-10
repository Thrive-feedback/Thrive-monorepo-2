import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Lee',
  profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  membership: {
    workspace: { id: 'w-1', name: 'Acme Corp' },
    role: 'OWNER',
  },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: (signedIn?: string) => requireMember(signedIn),
}));
vi.mock('./_components/member-and-invitation-list', () => ({
  MemberAndInvitationList: ({ ownEmail }: { ownEmail: string }) => (
    <output>{`people besides ${ownEmail}`}</output>
  ),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));

function open(searchParams: Record<string, string> = {}) {
  return Home({ searchParams: Promise.resolve(searchParams) });
}

describe('Home', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(open()).rejects.toThrow('redirect:/signin');
  });

  it('tells the gate the person has just signed in, so a redirect keeps the toast', async () => {
    requireMember.mockResolvedValue(ANN);

    await open({ signedIn: '1' });

    expect(requireMember).toHaveBeenLastCalledWith('1');
  });

  it('shows the Workspace name, the person’s email and their Role', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.getByText('Workspace name:').parentElement).toHaveTextContent(
      /^Workspace name:\s*Acme Corp$/,
    );
    expect(screen.getByText('My email:').parentElement).toHaveTextContent(
      /^My email:\s*ann@acme\.test$/,
    );
    expect(screen.getByText('My role:').parentElement).toHaveTextContent(
      /^My role:\s*Owner$/,
    );
  });

  it('lists everyone else in the person’s Workspace under My teammates', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(
      screen.getByRole('heading', { level: 2, name: 'My teammates' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('people besides ann@acme.test'),
    ).toBeInTheDocument();
  });

  it('no longer links to the component showcase', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(
      screen.queryByRole('link', { name: 'See the components' }),
    ).toBeNull();
  });

  it('says who signed in when Google has just sent them back', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ signedIn: '1' }));

    expect(
      screen.getByText('success toast: Signed in as ann@acme.test'),
    ).toBeInTheDocument();
  });

  it('raises no toast on an ordinary visit', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.queryByText(/success toast/)).toBeNull();
  });
});
