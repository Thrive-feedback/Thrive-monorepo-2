import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemberAndInvitationList } from './member-and-invitation-list';

const readMembersAndInvitations = vi.fn();
vi.mock('@/app/(signed-in)/home/_lib/members-and-invitations.service', () => ({
  readMembersAndInvitations: (...args: unknown[]) =>
    readMembersAndInvitations(...args),
}));

vi.mock('@/app/(signed-in)/home/_lib/invitation-actions.service', () => ({
  revokeInvitation: vi.fn(),
}));

const CAT_INVITATION = '0199a0f0-0000-7000-8000-000000000003';
const DAN_INVITATION = '0199a0f0-0000-7000-8000-000000000004';

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
        invitationId: null,
      },
      {
        email: 'cat@acme.test',
        name: null,
        role: 'MEMBER',
        status: 'PENDING',
        invitationId: CAT_INVITATION,
      },
      {
        email: 'dan@acme.test',
        name: null,
        role: 'MEMBER',
        status: 'EXPIRED',
        invitationId: DAN_INVITATION,
      },
    ]);

    await renderList();

    expect(
      screen
        .getAllByRole('listitem')
        .map((item) => item.firstElementChild?.textContent),
    ).toEqual([
      'ben@acme.test | Ben Hall : Admin : Joined',
      'cat@acme.test | — : Member : Pending',
      'dan@acme.test | — : Member : Expired',
    ]);
  });

  it('offers to revoke each Invitation, and nothing for a Member', async () => {
    readMembersAndInvitations.mockResolvedValue([
      {
        email: 'ben@acme.test',
        name: 'Ben Hall',
        role: 'ADMIN',
        status: 'JOINED',
        invitationId: null,
      },
      {
        email: 'cat@acme.test',
        name: null,
        role: 'MEMBER',
        status: 'PENDING',
        invitationId: CAT_INVITATION,
      },
    ]);

    await renderList();

    expect(
      screen.getAllByRole('button').map((button) => button.textContent),
    ).toEqual(['Revoke']);
    expect(
      screen.getByRole('button', {
        name: 'Revoke invitation to cat@acme.test',
      }),
    ).toBeInTheDocument();
  });

  it('says so when there is nobody else yet', async () => {
    readMembersAndInvitations.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('No teammates yet.')).toBeInTheDocument();
  });
});
