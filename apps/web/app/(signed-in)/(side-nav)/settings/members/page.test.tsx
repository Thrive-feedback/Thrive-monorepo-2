import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Members from './page';

function sessionAs(role: 'OWNER' | 'ADMIN' | 'MEMBER') {
  return {
    email: 'ann@acme.test',
    name: 'Ann Lee',
    profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
    membership: { workspace: { id: 'w-1', name: 'Acme Corp' }, role },
  };
}

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('./_components/member-list', () => ({
  MemberList: ({ ownEmail }: { ownEmail: string }) => (
    <output>{`members, with ${ownEmail} marked`}</output>
  ),
}));
vi.mock('./_components/invitation-list', () => ({
  InvitationList: () => <output>open invitations</output>,
}));

describe('Members', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Members()).rejects.toThrow('redirect:/signin');
  });

  it('shows the Owner who is in the Workspace and the Invitations still open', async () => {
    requireMember.mockResolvedValue(sessionAs('OWNER'));

    render(await Members());

    expect(
      screen.getByRole('heading', { level: 2, name: 'In Acme Corp' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('members, with ann@acme.test marked'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Open invitations' }),
    ).toBeInTheDocument();
    expect(screen.getByText('open invitations')).toBeInTheDocument();
  });

  it('shows an Admin the Invitations too', async () => {
    requireMember.mockResolvedValue(sessionAs('ADMIN'));

    render(await Members());

    expect(screen.getByText('open invitations')).toBeInTheDocument();
  });

  it('shows a Member who is in the Workspace, and no Invitations', async () => {
    requireMember.mockResolvedValue(sessionAs('MEMBER'));

    render(await Members());

    expect(
      screen.getByText('members, with ann@acme.test marked'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Open invitations' }),
    ).toBeNull();
    expect(screen.queryByText('open invitations')).toBeNull();
  });
});
