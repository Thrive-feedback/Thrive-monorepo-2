import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Workspace from './page';

function sessionAs(role: 'ADMIN' | 'MEMBER') {
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
vi.mock('./_components/invite-members-form', () => ({
  InviteMembersForm: () => <output>invite form</output>,
}));

describe('Workspace', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Workspace()).rejects.toThrow('redirect:/signin');
  });

  it('shows an Admin who is in the Workspace and the Invitations still open', async () => {
    requireMember.mockResolvedValue(sessionAs('ADMIN'));

    render(await Workspace());

    expect(
      screen.getByRole('heading', { level: 2, name: 'Acme Corp' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Members' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('members, with ann@acme.test marked'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Open invitations' }),
    ).toBeInTheDocument();
    expect(screen.getByText('open invitations')).toBeInTheDocument();
  });

  it('lets an Admin invite teammates, above the open Invitations', async () => {
    requireMember.mockResolvedValue(sessionAs('ADMIN'));

    render(await Workspace());

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      'Members',
      'Invite teammates',
      'Open invitations',
    ]);
    expect(screen.getByText('invite form')).toBeInTheDocument();
  });

  it('shows a Member the Workspace and who is in it, and no Invitations', async () => {
    requireMember.mockResolvedValue(sessionAs('MEMBER'));

    render(await Workspace());

    expect(
      screen.getByText('members, with ann@acme.test marked'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Open invitations' }),
    ).toBeNull();
    expect(screen.queryByText('open invitations')).toBeNull();
    expect(
      screen.queryByRole('heading', { name: 'Invite teammates' }),
    ).toBeNull();
    expect(screen.queryByText('invite form')).toBeNull();
  });
});
