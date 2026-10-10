import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemberAndInvitationList } from './member-and-invitation-list';

const readMembersAndInvitations = vi.fn();
vi.mock('@/app/(signed-in)/home/_lib/members-and-invitations.service', () => ({
  readMembersAndInvitations: (...args: unknown[]) =>
    readMembersAndInvitations(...args),
}));

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'OWNER',
} as const;

async function renderList() {
  render(
    await MemberAndInvitationList({
      membership: MEMBERSHIP,
      ownEmail: 'ann@acme.test',
    }),
  );
}

describe('MemberAndInvitationList', () => {
  it('reads the people of the person’s own Workspace, leaving the person out', async () => {
    readMembersAndInvitations.mockResolvedValue([]);

    await renderList();

    expect(readMembersAndInvitations).toHaveBeenCalledWith(
      MEMBERSHIP,
      'ann@acme.test',
    );
  });

  it('shows each as email | name : role : status, with a dash for no name', async () => {
    readMembersAndInvitations.mockResolvedValue([
      {
        email: 'ben@acme.test',
        name: 'Ben Hall',
        role: 'ADMIN',
        status: 'JOINED',
      },
      { email: 'cat@acme.test', name: null, role: 'MEMBER', status: 'PENDING' },
      { email: 'dan@acme.test', name: null, role: 'MEMBER', status: 'EXPIRED' },
    ]);

    await renderList();

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual([
      'ben@acme.test | Ben Hall : Admin : Joined',
      'cat@acme.test | — : Member : Pending',
      'dan@acme.test | — : Member : Expired',
    ]);
  });

  it('says so when there is nobody else yet', async () => {
    readMembersAndInvitations.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('No teammates yet.')).toBeInTheDocument();
  });
});
