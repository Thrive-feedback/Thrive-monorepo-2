import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceGoalActionResult } from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import {
  HideWorkspaceGoalButton,
  ShowWorkspaceGoalButton,
} from './change-workspace-goal-button';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

type Change = (
  workspaceId: string,
  workspaceGoalId: string,
) => Promise<WorkspaceGoalActionResult>;
const hideWorkspaceGoal = vi.fn<Change>();
const showWorkspaceGoal = vi.fn<Change>();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-actions.service',
  () => ({
    hideWorkspaceGoal: (workspaceId: string, workspaceGoalId: string) =>
      hideWorkspaceGoal(workspaceId, workspaceGoalId),
    showWorkspaceGoal: (workspaceId: string, workspaceGoalId: string) =>
      showWorkspaceGoal(workspaceId, workspaceGoalId),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  hideWorkspaceGoal.mockReset();
  showWorkspaceGoal.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('HideWorkspaceGoalButton', () => {
  it('hides it at once and says so', async () => {
    const user = userEvent.setup();
    hideWorkspaceGoal.mockResolvedValue({ ok: true });
    render(
      <HideWorkspaceGoalButton
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-1"
        name="ownership"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Hide #ownership' }));

    expect(hideWorkspaceGoal).toHaveBeenCalledWith(WORKSPACE_ID, 'g-1');
    expect(toast.success).toHaveBeenCalledWith('#ownership is hidden');
  });

  it('says why when it could not', async () => {
    const user = userEvent.setup();
    hideWorkspaceGoal.mockResolvedValue({
      ok: false,
      message: 'It was already hidden.',
    });
    render(
      <HideWorkspaceGoalButton
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-1"
        name="ownership"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Hide #ownership' }));

    expect(toast.error).toHaveBeenCalledWith('It was already hidden.');
  });
});

describe('ShowWorkspaceGoalButton', () => {
  it('shows it again at once and says so', async () => {
    const user = userEvent.setup();
    showWorkspaceGoal.mockResolvedValue({ ok: true });
    render(
      <ShowWorkspaceGoalButton
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-2"
        name="ownershic"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Show #ownershic' }));

    expect(showWorkspaceGoal).toHaveBeenCalledWith(WORKSPACE_ID, 'g-2');
    expect(toast.success).toHaveBeenCalledWith('#ownershic is shown again');
  });
});
