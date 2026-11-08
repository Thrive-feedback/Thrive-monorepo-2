import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AddWorkspaceGoalResult } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import { AddWorkspaceGoal } from './add-workspace-goal';

const addWorkspaceGoal = vi.fn<() => Promise<AddWorkspaceGoalResult>>();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-actions.service',
  () => ({ addWorkspaceGoal: () => addWorkspaceGoal() }),
);
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

async function openTheDialog() {
  const user = userEvent.setup();
  render(<AddWorkspaceGoal workspaceId="w-1" />);
  const trigger = screen.getByRole('button', { name: 'Add a Workspace Goal' });
  await user.click(trigger);
  return { user, trigger };
}

describe('AddWorkspaceGoal', () => {
  it('keeps the form shut until asked for', () => {
    render(<AddWorkspaceGoal workspaceId="w-1" />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the form in a dialog named for it, and gives focus back on closing', async () => {
    const { user, trigger } = await openTheDialog();

    expect(
      screen.getByRole('dialog', { name: 'Add a Workspace Goal' }),
    ).toHaveAccessibleDescription(
      'Members write it after # in their Feedback.',
    );

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes once the Goal is added', async () => {
    addWorkspaceGoal.mockResolvedValue({ ok: true });
    const { user } = await openTheDialog();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'ownership');
    await user.click(
      screen.getByRole('button', { name: 'Add Workspace Goal' }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('stays open when the Goal is refused, with the reason under the name', async () => {
    addWorkspaceGoal.mockResolvedValue({
      ok: false,
      field: 'name',
      message: 'That name is taken.',
    });
    const { user } = await openTheDialog();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'ownership');
    await user.click(
      screen.getByRole('button', { name: 'Add Workspace Goal' }),
    );

    expect(await screen.findByText('That name is taken.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('closes on Cancel, and gives focus back', async () => {
    const user = userEvent.setup();
    render(<AddWorkspaceGoal workspaceId="w-1" />);
    const trigger = screen.getByRole('button', {
      name: 'Add a Workspace Goal',
    });
    await user.click(trigger);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
