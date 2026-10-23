import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Workspace from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Lee',
  profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  membership: { workspace: { id: 'w-1', name: 'Acme Corp' }, role: 'MEMBER' },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('./_components/leave-workspace-row', () => ({
  LeaveWorkspaceRow: ({ ownEmail }: { ownEmail: string }) => (
    <output>{`leave, as ${ownEmail}`}</output>
  ),
  LeaveWorkspaceRowSkeleton: () => null,
}));
vi.mock('./_components/workspace-switcher-loader', () => ({
  WorkspaceSwitcherLoader: () => <output>workspace switcher</output>,
}));
vi.mock('./_components/integration-list', () => ({
  IntegrationList: () => <output>chat tools</output>,
  IntegrationListSkeleton: () => null,
}));

describe('Workspace', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Workspace()).rejects.toThrow('redirect:/signin');
  });

  it("shows the Workspace's name", async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Workspace());

    expect(
      screen.getByText('Workspace name', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent('Acme Corp');
  });

  it('shows their Role in this Workspace', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Workspace());

    expect(
      screen.getByText('Your Role', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent('Member');
  });

  it('offers Switch Workspace, then the way to leave, in that order', async () => {
    requireMember.mockResolvedValue(ANN);

    const { container } = render(await Workspace());

    expect(screen.getByText('Switch Workspace')).toBeInTheDocument();
    expect(container).toHaveTextContent(
      /Workspace name.*Your Role.*Switch Workspace.*workspace switcher.*leave, as ann@acme\.test/,
    );
  });

  it('leaves who is in the Workspace to Settings → Members', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Workspace());

    expect(screen.queryByRole('heading', { name: 'Members' })).toBeNull();
  });

  it('shows which chat tools the Workspace posts into', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Workspace());

    expect(screen.getByText('chat tools')).toBeInTheDocument();
  });
});
