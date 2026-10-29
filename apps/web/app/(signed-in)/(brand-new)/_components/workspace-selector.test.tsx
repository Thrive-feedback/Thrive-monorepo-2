import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  SwitchLanding,
  SwitchWorkspaceResult,
} from '@/lib/workspace/workspace-switch-actions.service';
import { WorkspaceSelector } from './workspace-selector';

const switchWorkspace =
  vi.fn<
    (
      workspaceId: string,
      landing?: SwitchLanding,
    ) => Promise<SwitchWorkspaceResult>
  >();
vi.mock('@/lib/workspace/workspace-switch-actions.service', () => ({
  switchWorkspace: (workspaceId: string, landing?: SwitchLanding) =>
    switchWorkspace(workspaceId, landing),
  createAnotherWorkspace: vi.fn(),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const GLOBEX = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Globex' };
const INITECH = { id: '0199a0f0-0000-7000-8000-0000000000cc', name: 'Initech' };

beforeEach(() => {
  switchWorkspace.mockReset();
  toast.error.mockReset();
});

async function openMenu() {
  const user = userEvent.setup();
  render(
    <WorkspaceSelector
      current={ACME}
      workspaces={{ active: [ACME, GLOBEX], inactive: [INITECH] }}
    />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Workspace: Acme. Switch Workspace' }),
  );
  return user;
}

describe('WorkspaceSelector', () => {
  it('only names the Workspace when the person has no other to open', () => {
    render(
      <WorkspaceSelector
        current={ACME}
        workspaces={{ active: [ACME], inactive: [INITECH] }}
      />,
    );

    expect(screen.getByText('Acme')).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('lists the Workspaces, ticking the current one and closing the ones the person left', async () => {
    await openMenu();

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Acme' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Globex' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('menuitem', { name: 'Initech Inactive' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('menu')).not.toHaveTextContent(/admin|member/i);
  });

  it('switches at once and lands on the new Home', async () => {
    switchWorkspace.mockReturnValue(new Promise(() => {}));
    const user = await openMenu();

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Globex' }));

    expect(switchWorkspace).toHaveBeenCalledExactlyOnceWith(
      GLOBEX.id,
      'brandNewHome',
    );
  });

  it('does nothing when the current Workspace is chosen again', async () => {
    const user = await openMenu();

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Acme' }));

    expect(switchWorkspace).not.toHaveBeenCalled();
  });

  it('says why when the switch is refused', async () => {
    switchWorkspace.mockResolvedValue({
      ok: false,
      message: "You're no longer in that Workspace.",
    });
    const user = await openMenu();

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Globex' }));

    expect(toast.error).toHaveBeenCalledWith(
      "You're no longer in that Workspace.",
    );
  });

  it('opens the form to create a Workspace in a dialog', async () => {
    const user = await openMenu();

    await user.click(
      screen.getByRole('menuitem', { name: 'Create a Workspace' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Create a Workspace' }),
    ).toBeVisible();
  });
});
