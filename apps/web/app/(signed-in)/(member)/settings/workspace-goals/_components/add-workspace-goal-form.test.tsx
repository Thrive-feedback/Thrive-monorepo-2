import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddWorkspaceGoalResult } from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import { AddWorkspaceGoalForm } from './add-workspace-goal-form';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const addWorkspaceGoal =
  vi.fn<
    (
      workspaceId: string,
      input: { name: string; description: string },
    ) => Promise<AddWorkspaceGoalResult>
  >();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-actions.service',
  () => ({
    addWorkspaceGoal: (
      workspaceId: string,
      input: { name: string; description: string },
    ) => addWorkspaceGoal(workspaceId, input),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  addWorkspaceGoal.mockReset();
  toast.success.mockReset();
});

function nameField() {
  return screen.getByRole('textbox', { name: 'Name' });
}

function descriptionField() {
  return screen.getByRole('textbox', { name: 'Description' });
}

describe('AddWorkspaceGoalForm', () => {
  it('adds one with its description, says so, and clears the fields', async () => {
    const user = userEvent.setup();
    addWorkspaceGoal.mockResolvedValue({ ok: true });
    render(<AddWorkspaceGoalForm workspaceId={WORKSPACE_ID} />);

    await user.type(nameField(), '#ownership');
    await user.type(descriptionField(), 'We finish what we start.');
    await user.click(
      screen.getByRole('button', { name: 'Add Workspace Goal' }),
    );

    expect(addWorkspaceGoal).toHaveBeenCalledWith(WORKSPACE_ID, {
      name: '#ownership',
      description: 'We finish what we start.',
    });
    expect(toast.success).toHaveBeenCalledWith('#ownership added');
    expect(nameField()).toHaveValue('');
    expect(descriptionField()).toHaveValue('');
  });

  it.each([
    ['ship it', 'Use - instead of spaces.'],
    ['a-name-that-is-much-too-long-xx', 'Keep it to 30 characters.'],
    ['own.ership', 'Use only letters, numbers, - and _.'],
  ])(
    'refuses %j under the name before sending anything',
    async (name, message) => {
      const user = userEvent.setup();
      render(<AddWorkspaceGoalForm workspaceId={WORKSPACE_ID} />);

      await user.type(nameField(), name);
      await user.click(
        screen.getByRole('button', { name: 'Add Workspace Goal' }),
      );

      expect(nameField()).toHaveAccessibleDescription(message);
      expect(nameField()).toBeInvalid();
      expect(addWorkspaceGoal).not.toHaveBeenCalled();
    },
  );

  it('asks for a name when none was written', async () => {
    const user = userEvent.setup();
    render(<AddWorkspaceGoalForm workspaceId={WORKSPACE_ID} />);

    await user.click(
      screen.getByRole('button', { name: 'Add Workspace Goal' }),
    );

    expect(nameField()).toHaveAccessibleDescription('Give it a name.');
  });

  it('shows under the name that it is already taken, keeping what was written', async () => {
    const user = userEvent.setup();
    addWorkspaceGoal.mockResolvedValue({
      ok: false,
      field: 'name',
      message:
        'This Workspace already has that name, or had it and hid it. Show the hidden one again instead.',
    });
    render(<AddWorkspaceGoalForm workspaceId={WORKSPACE_ID} />);

    await user.type(nameField(), 'OWNERSHIP');
    await user.click(
      screen.getByRole('button', { name: 'Add Workspace Goal' }),
    );

    expect(nameField()).toHaveAccessibleDescription(
      'This Workspace already has that name, or had it and hid it. Show the hidden one again instead.',
    );
    expect(nameField()).toHaveValue('OWNERSHIP');
  });

  it('says over the form what went wrong when it is not about a field', async () => {
    const user = userEvent.setup();
    addWorkspaceGoal.mockResolvedValue({
      ok: false,
      field: 'form',
      message: 'Only Admins can add Workspace Goals.',
    });
    render(<AddWorkspaceGoalForm workspaceId={WORKSPACE_ID} />);

    await user.type(nameField(), 'ownership');
    await user.click(
      screen.getByRole('button', { name: 'Add Workspace Goal' }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only Admins can add Workspace Goals.',
    );
  });
});
