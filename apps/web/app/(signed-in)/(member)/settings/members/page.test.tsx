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
vi.mock('./_components/invite-members-form', () => ({
  InviteMembersForm: () => <output>invite form</output>,
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

  it('lets the Owner and Admins invite teammates, above the open Invitations', async () => {
    for (const role of ['OWNER', 'ADMIN'] as const) {
      requireMember.mockResolvedValue(sessionAs(role));

      const { unmount } = render(await Members());

      const headings = screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent);
      expect(headings).toEqual([
        'In Acme Corp',
        'Invite teammates',
        'Open invitations',
      ]);
      expect(screen.getByText('invite form')).toBeInTheDocument();
      unmount();
    }
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
    expect(
      screen.queryByRole('heading', { name: 'Invite teammates' }),
    ).toBeNull();
    expect(screen.queryByText('invite form')).toBeNull();
  });
});
