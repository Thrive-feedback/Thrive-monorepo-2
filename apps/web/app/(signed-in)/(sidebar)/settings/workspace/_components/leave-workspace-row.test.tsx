import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeaveWorkspaceRow } from './leave-workspace-row';

const readMembers = vi.fn();
vi.mock('@/app/(signed-in)/(sidebar)/settings/_lib/members.service', () => ({
  readMembers: (...args: unknown[]) => readMembers(...args),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/_lib/member-deactivation-actions.service',
  () => ({ deactivateMember: vi.fn(), leaveWorkspace: vi.fn() }),
);

const WORKSPACE = { id: 'w-1', name: 'Acme Corp' };
const ANN = {
  accountId: 'a-1',
  email: 'ann@acme.test',
  name: 'Ann',
  photoUrl: null,
  role: 'ADMIN',
};
const BEN = {
  accountId: 'a-2',
  email: 'ben@acme.test',
  name: 'Ben',
  photoUrl: null,
  role: 'MEMBER',
};

describe('LeaveWorkspaceRow', () => {
  it('offers to leave, saying the Feedback stays', async () => {
    readMembers.mockResolvedValue([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'MEMBER' } as const;

    render(await LeaveWorkspaceRow({ membership, ownEmail: 'ben@acme.test' }));

    const leave = screen.getByRole('button', { name: 'Leave Workspace' });
    expect(leave).toBeEnabled();
    expect(leave).toHaveAccessibleDescription(
      "You won't be able to open Acme Corp again. The Feedback you gave and received stays, with “(inactive)” after your name.",
    );
  });

  it('answers the only Admin pressing Leave with why they cannot, and does not ask to leave', async () => {
    readMembers.mockResolvedValue([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;
    const user = userEvent.setup();

    render(await LeaveWorkspaceRow({ membership, ownEmail: 'ann@acme.test' }));

    const leave = screen.getByRole('button', { name: 'Leave Workspace' });
    expect(leave).toBeEnabled();
    expect(leave).not.toHaveAccessibleDescription();

    await user.click(leave);

    expect(
      screen.getByRole('dialog', { name: "You're the only Admin" }),
    ).toHaveTextContent(
      'Acme Corp always needs at least one Admin. Make someone else an Admin first, then you can leave.',
    );
    expect(
      screen.queryByRole('button', { name: 'Leave Acme Corp' }),
    ).toBeNull();
  });

  it('lets an Admin leave while another Admin stays', async () => {
    readMembers.mockResolvedValue([ANN, { ...BEN, role: 'ADMIN' }]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await LeaveWorkspaceRow({ membership, ownEmail: 'ann@acme.test' }));

    expect(
      screen.getByRole('button', { name: 'Leave Workspace' }),
    ).toBeEnabled();
  });
});
