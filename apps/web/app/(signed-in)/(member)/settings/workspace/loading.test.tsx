import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceLoading from './loading';

// The section it imitates reads and writes through these; the skeleton itself never calls them.
vi.mock('@/app/(signed-in)/(member)/settings/_lib/members.service', () => ({
  readMembers: vi.fn(),
}));
vi.mock(
  '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service',
  () => ({ deactivateMember: vi.fn(), leaveWorkspace: vi.fn() }),
);
vi.mock('@/lib/workspace/my-workspaces.service', () => ({
  readMyWorkspaces: vi.fn(),
}));
vi.mock('@/lib/workspace/workspace-switch-actions.service', () => ({
  switchWorkspace: vi.fn(),
  createAnotherWorkspace: vi.fn(),
}));

describe('WorkspaceLoading', () => {
  it('says once that it is loading', () => {
    render(<WorkspaceLoading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(within(status).getByText('Loading…')).toBeInTheDocument();
  });

  it('keeps every row where it will be, labelled, with nothing to press yet', () => {
    const { container } = render(<WorkspaceLoading />);

    expect(container).toHaveTextContent(
      /Workspace name.*Your Role.*Switch Workspace.*Leave Workspace/,
    );
    expect(
      screen.getByRole('button', { name: 'Switch Workspace', hidden: true }),
    ).toBeDisabled();
  });
});
