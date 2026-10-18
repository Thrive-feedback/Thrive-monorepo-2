import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeaveWorkspaceRow } from './leave-workspace-row';

const readMembers = vi.fn();
vi.mock('@/app/(signed-in)/(member)/settings/_lib/members.service', () => ({
  readMembers: (...args: unknown[]) => readMembers(...args),
}));
vi.mock(
  '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service',
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
      "You won't be able to open Acme Corp again. Your Feedback stays, with “(inactive)” after your name.",
    );
  });

  it('does not let the only Admin leave, and says why', async () => {
    readMembers.mockResolvedValue([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await LeaveWorkspaceRow({ membership, ownEmail: 'ann@acme.test' }));

    const leave = screen.getByRole('button', { name: 'Leave Workspace' });
    expect(leave).toBeDisabled();
    expect(leave).toHaveAccessibleDescription(
      "You're the only Admin of Acme Corp. Make someone else an Admin first to leave.",
    );
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
