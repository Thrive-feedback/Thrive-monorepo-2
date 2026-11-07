import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceGoalActionResult } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import { WorkspaceGoalActions } from './workspace-goal-actions';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

type Change = (
  workspaceId: string,
  workspaceGoalId: string,
) => Promise<WorkspaceGoalActionResult>;
const hideWorkspaceGoal = vi.fn<Change>();
const showWorkspaceGoal = vi.fn<Change>();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-actions.service',
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

/** Opens a Workspace Goal's menu and picks its one choice, which asks before it acts. */
async function ask(
  user: ReturnType<typeof userEvent.setup>,
  hashtag: string,
  verb: 'Hide' | 'Show',
) {
  await user.click(screen.getByRole('button', { name: `Manage ${hashtag}` }));
  await user.click(screen.getByRole('menuitem', { name: `${verb}` }));
}

describe('WorkspaceGoalActions', () => {
  it('asks before hiding, saying what it changes and what it keeps', async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceGoalActions
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-1"
        name="ownership"
        isHidden={false}
      />,
    );

    await ask(user, '#ownership', 'Hide');

    expect(
      await screen.findByRole('dialog', { name: 'Hide #ownership?' }),
    ).toHaveAccessibleDescription(
      "Teammates won't be offered #ownership when they type #. Feedback that already uses it keeps it. You can show it again any time.",
    );
    expect(hideWorkspaceGoal).not.toHaveBeenCalled();
  });

  it('hides it once confirmed, and says so', async () => {
    const user = userEvent.setup();
    hideWorkspaceGoal.mockResolvedValue({ ok: true });
    render(
      <WorkspaceGoalActions
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-1"
        name="ownership"
        isHidden={false}
      />,
    );

    await ask(user, '#ownership', 'Hide');
    await user.click(
      await screen.findByRole('button', { name: 'Hide #ownership' }),
    );

    expect(hideWorkspaceGoal).toHaveBeenCalledWith(WORKSPACE_ID, 'g-1');
    expect(toast.success).toHaveBeenCalledWith('#ownership is hidden');
  });

  it('changes nothing when the Admin thinks better of it, and gives focus back to the menu', async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceGoalActions
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-1"
        name="ownership"
        isHidden={false}
      />,
    );

    await ask(user, '#ownership', 'Hide');
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(hideWorkspaceGoal).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Manage #ownership' }),
    ).toHaveFocus();
  });

  it('says why when it could not', async () => {
    const user = userEvent.setup();
    hideWorkspaceGoal.mockResolvedValue({
      ok: false,
      message: 'It was already hidden.',
    });
    render(
      <WorkspaceGoalActions
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-1"
        name="ownership"
        isHidden={false}
      />,
    );

    await ask(user, '#ownership', 'Hide');
    await user.click(
      await screen.findByRole('button', { name: 'Hide #ownership' }),
    );

    expect(toast.error).toHaveBeenCalledWith('It was already hidden.');
  });

  it('shows a hidden one again once confirmed, and says so', async () => {
    const user = userEvent.setup();
    showWorkspaceGoal.mockResolvedValue({ ok: true });
    render(
      <WorkspaceGoalActions
        workspaceId={WORKSPACE_ID}
        workspaceGoalId="g-2"
        name="ownershic"
        isHidden
      />,
    );

    await ask(user, '#ownershic', 'Show');
    expect(
      await screen.findByRole('dialog', { name: 'Show #ownershic again?' }),
    ).toHaveAccessibleDescription(
      'Teammates can pick #ownershic again when they type #.',
    );
    await user.click(screen.getByRole('button', { name: 'Show #ownershic' }));

    expect(showWorkspaceGoal).toHaveBeenCalledWith(WORKSPACE_ID, 'g-2');
    expect(toast.success).toHaveBeenCalledWith('#ownershic is shown again');
  });
});
