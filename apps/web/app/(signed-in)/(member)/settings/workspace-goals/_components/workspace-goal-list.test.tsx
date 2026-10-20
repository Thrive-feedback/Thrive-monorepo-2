import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceGoalList } from './workspace-goal-list';

const readWorkspaceGoals = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goals.service',
  () => ({
    readWorkspaceGoals: (...args: unknown[]) => readWorkspaceGoals(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-actions.service',
  () => ({ hideWorkspaceGoal: vi.fn(), showWorkspaceGoal: vi.fn() }),
);

const WORKSPACE = { id: 'w-1', name: 'Acme Corp' };
const OWNERSHIP = {
  id: 'g-1',
  name: 'ownership',
  description: 'We finish what we start.',
  status: 'ACTIVE',
};
const OWNERSHIC = {
  id: 'g-2',
  name: 'ownershic',
  description: null,
  status: 'HIDDEN',
};

describe('WorkspaceGoalList', () => {
  it('shows a Member each one as a hashtag over its description, with nothing to press', async () => {
    readWorkspaceGoals.mockResolvedValue([OWNERSHIP]);
    const membership = { workspace: WORKSPACE, role: 'MEMBER' } as const;

    render(await WorkspaceGoalList({ membership }));

    const list = screen.getByRole('list', { name: 'Workspace Goals' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['#ownershipWe finish what we start.']);
    expect(screen.queryByRole('button')).toBeNull();
    expect(readWorkspaceGoals).toHaveBeenCalledWith(membership);
  });

  it('shows an Admin the hidden ones marked hidden, with Show for those and Hide for the rest', async () => {
    readWorkspaceGoals.mockResolvedValue([OWNERSHIC, OWNERSHIP]);

    render(
      await WorkspaceGoalList({
        membership: { workspace: WORKSPACE, role: 'ADMIN' },
      }),
    );

    const [hidden, active] = screen.getAllByRole('listitem');
    expect(hidden).toHaveTextContent('#ownershic(Hidden)');
    expect(
      within(hidden as HTMLElement).getByRole('button', {
        name: 'Show #ownershic',
      }),
    ).toBeInTheDocument();
    expect(active).not.toHaveTextContent('Hidden');
    expect(
      within(active as HTMLElement).getByRole('button', {
        name: 'Hide #ownership',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rename|delete/i })).toBeNull();
  });

  it('invites an Admin to add the first one when there are none', async () => {
    readWorkspaceGoals.mockResolvedValue([]);

    render(
      await WorkspaceGoalList({
        membership: { workspace: WORKSPACE, role: 'ADMIN' },
      }),
    );

    expect(
      screen.getByText('No Workspace Goals yet. Add your first one below.'),
    ).toBeInTheDocument();
  });

  it('tells a Member none are set when there are none', async () => {
    readWorkspaceGoals.mockResolvedValue([]);

    render(
      await WorkspaceGoalList({
        membership: { workspace: WORKSPACE, role: 'MEMBER' },
      }),
    );

    expect(
      screen.getByText("Your Admins haven't set any Workspace Goals yet."),
    ).toBeInTheDocument();
  });
});
