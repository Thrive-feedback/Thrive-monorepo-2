import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceGoals from './page';

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
vi.mock('./_components/workspace-goal-list', () => ({
  WorkspaceGoalList: () => <output>workspace goals</output>,
  WorkspaceGoalListSkeleton: () => null,
}));
vi.mock('./_components/add-workspace-goal-form', () => ({
  AddWorkspaceGoalForm: () => <output>add form</output>,
}));

describe('Workspace Goals', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(WorkspaceGoals()).rejects.toThrow('redirect:/signin');
  });

  it('shows an Admin the list and a way to add one', async () => {
    requireMember.mockResolvedValue(sessionAs('ADMIN'));

    render(await WorkspaceGoals());

    expect(screen.getByText('workspace goals')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Add a Workspace Goal' }),
    ).toBeInTheDocument();
    expect(screen.getByText('add form')).toBeInTheDocument();
  });

  it('shows a Member the list with no way to add one', async () => {
    requireMember.mockResolvedValue(sessionAs('MEMBER'));

    render(await WorkspaceGoals());

    expect(screen.getByText('workspace goals')).toBeInTheDocument();
    expect(screen.queryByText('add form')).toBeNull();
  });
});
