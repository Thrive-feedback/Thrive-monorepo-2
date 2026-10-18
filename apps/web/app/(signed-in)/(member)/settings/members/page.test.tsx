import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Members from './page';

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
  MemberListSkeleton: () => null,
}));
vi.mock('./_components/invitation-list', () => ({
  InvitationList: () => <output>open invitations</output>,
  InvitationListSkeleton: () => null,
}));
vi.mock('./_components/invite-members-form', () => ({
  InviteMembersForm: () => <output>invite form</output>,
}));

describe('Members', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Members()).rejects.toThrow('redirect:/signin');
  });

  it('shows an Admin who is in the Workspace, inviting more, and the Invitations still open', async () => {
    requireMember.mockResolvedValue(sessionAs('ADMIN'));

    render(await Members());

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(['Invite people', 'Invitations']);
    expect(
      screen.getByText('members, with ann@acme.test marked'),
    ).toBeInTheDocument();
    expect(screen.getByText('invite form')).toBeInTheDocument();
    expect(screen.getByText('open invitations')).toBeInTheDocument();
  });

  it('shows a Member who is in the Workspace, with no inviting and no Invitations', async () => {
    requireMember.mockResolvedValue(sessionAs('MEMBER'));

    render(await Members());

    expect(
      screen.getByText('members, with ann@acme.test marked'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Invite people' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Invitations' })).toBeNull();
  });
});
