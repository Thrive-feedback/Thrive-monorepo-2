import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SwitchWorkspaceResult } from '@/lib/workspace/workspace-switch-actions.service';
import { WorkspaceSwitcher } from './workspace-switcher';

const switchWorkspace =
  vi.fn<(workspaceId: string) => Promise<SwitchWorkspaceResult>>();
vi.mock('@/lib/workspace/workspace-switch-actions.service', () => ({
  switchWorkspace: (workspaceId: string) => switchWorkspace(workspaceId),
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

async function openSwitcher() {
  const user = userEvent.setup();
  render(
    <WorkspaceSwitcher
      currentWorkspaceId={ACME.id}
      workspaces={{ active: [ACME, GLOBEX], inactive: [INITECH] }}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Switch Workspace' }));
  return user;
}

describe('WorkspaceSwitcher', () => {
  it('lists the Workspaces the person is in, marking the current one, with no Role', async () => {
    await openSwitcher();

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Pick a Workspace to open on this device.',
    );
    const list = screen.getByRole('list', { name: 'Your Workspaces' });
    const current = within(list).getByText('Acme').closest('li');
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveTextContent('Current');
    expect(
      within(list).getByRole('button', { name: 'Globex' }),
    ).toBeInTheDocument();
    expect(list).not.toHaveTextContent(/admin|member/i);
  });

  it('shows a Workspace they were Deactivated in as Inactive, and offers no way to open it', async () => {
    await openSwitcher();

    const list = screen.getByRole('list', { name: 'Your Workspaces' });
    expect(within(list).getByText('Initech').closest('li')).toHaveTextContent(
      'Inactive',
    );
    expect(
      within(list).queryByRole('button', { name: 'Initech' }),
    ).not.toBeInTheDocument();
  });

  it('asks before switching, naming the Workspace closed and the one opened', async () => {
    const user = await openSwitcher();

    await user.click(screen.getByRole('button', { name: 'Globex' }));

    expect(
      screen.getByRole('heading', { name: 'Switch to Globex?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You'll close Acme on this device and open Globex."),
    ).toBeInTheDocument();
    expect(switchWorkspace).not.toHaveBeenCalled();
  });

  it('switches once the person confirms', async () => {
    // Switching navigates away, so the action never answers.
    switchWorkspace.mockReturnValue(new Promise(() => {}));
    const user = await openSwitcher();

    await user.click(screen.getByRole('button', { name: 'Globex' }));
    await user.click(screen.getByRole('button', { name: 'Open Globex' }));

    expect(switchWorkspace).toHaveBeenCalledWith(GLOBEX.id);
  });

  it('goes back to the list without switching on Back', async () => {
    const user = await openSwitcher();

    await user.click(screen.getByRole('button', { name: 'Globex' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(
      screen.getByRole('list', { name: 'Your Workspaces' }),
    ).toBeInTheDocument();
    expect(switchWorkspace).not.toHaveBeenCalled();
  });

  it('says why when it could not switch', async () => {
    switchWorkspace.mockResolvedValue({
      ok: false,
      message: "You're no longer in that Workspace.",
    });
    const user = await openSwitcher();

    await user.click(screen.getByRole('button', { name: 'Globex' }));
    await user.click(screen.getByRole('button', { name: 'Open Globex' }));

    expect(toast.error).toHaveBeenCalledWith(
      "You're no longer in that Workspace.",
    );
  });

  it('says on its button that creating jumps to the new Workspace', async () => {
    const user = await openSwitcher();

    await user.click(
      screen.getByRole('button', { name: 'Create a Workspace' }),
    );

    expect(
      screen.getByRole('button', { name: 'Create and open' }),
    ).toBeInTheDocument();
  });

  it('turns into the form for creating a Workspace, and back', async () => {
    const user = await openSwitcher();

    await user.click(
      screen.getByRole('button', { name: 'Create a Workspace' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Create a Workspace' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Workspace name' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to your Workspaces' }),
    );

    expect(
      screen.getByRole('list', { name: 'Your Workspaces' }),
    ).toBeInTheDocument();
  });
});
