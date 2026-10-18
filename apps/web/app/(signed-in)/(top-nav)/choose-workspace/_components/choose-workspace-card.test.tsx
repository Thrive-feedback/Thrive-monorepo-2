import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SwitchWorkspaceResult } from '@/lib/workspace/workspace-switch-actions.service';
import { ChooseWorkspaceCard } from './choose-workspace-card';

const switchWorkspace =
  vi.fn<(workspaceId: string) => Promise<SwitchWorkspaceResult>>();
vi.mock('@/lib/workspace/workspace-switch-actions.service', () => ({
  switchWorkspace: (workspaceId: string) => switchWorkspace(workspaceId),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const GLOBEX = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Globex' };
const INITECH = { id: '0199a0f0-0000-7000-8000-0000000000cc', name: 'Initech' };
const TO_UMBRELLA = {
  invitationId: '0199a0f0-0000-7000-8000-000000000001',
  workspace: { name: 'Umbrella', memberCount: 4 },
  invitedAt: new Date('2026-10-10T03:00:00.000Z'),
};

beforeEach(() => {
  switchWorkspace.mockReset();
  toast.error.mockReset();
});

function renderCard(invitations = [TO_UMBRELLA]) {
  render(
    <ChooseWorkspaceCard
      workspaces={{ active: [ACME, GLOBEX], inactive: [INITECH] }}
      invitations={invitations}
    />,
  );
  return userEvent.setup();
}

describe('ChooseWorkspaceCard', () => {
  it('offers each Workspace the person can open, with none marked current', () => {
    renderCard();

    const list = screen.getByRole('list', { name: 'Your Workspaces' });
    expect(within(list).getByRole('button', { name: 'Acme' })).toBeEnabled();
    expect(within(list).getByRole('button', { name: 'Globex' })).toBeEnabled();
    expect(list).not.toHaveTextContent('Current');
  });

  it('opens the Workspace chosen at once, without asking', async () => {
    switchWorkspace.mockReturnValue(new Promise(() => {}));
    const user = renderCard();

    await user.click(screen.getByRole('button', { name: 'Globex' }));

    expect(switchWorkspace).toHaveBeenCalledWith(GLOBEX.id);
  });

  it('shows a Workspace they were Deactivated in as Inactive, with no way in', () => {
    renderCard();

    expect(screen.getByText('Initech').closest('li')).toHaveTextContent(
      'Inactive',
    );
    expect(
      screen.queryByRole('button', { name: 'Initech' }),
    ).not.toBeInTheDocument();
  });

  it('lists the Invitations waiting, each to its own page', () => {
    renderCard();

    const invitations = screen.getByRole('list', {
      name: 'Invitations waiting for you',
    });
    expect(invitations).toHaveTextContent('Umbrella');
    expect(
      within(invitations).getByRole('link', { name: 'See the invitation' }),
    ).toHaveAttribute('href', `/invitations/${TO_UMBRELLA.invitationId}`);
  });

  it('says nothing about Invitations while none is waiting', () => {
    renderCard([]);

    expect(
      screen.queryByRole('list', { name: 'Invitations waiting for you' }),
    ).not.toBeInTheDocument();
  });

  it('offers to create a Workspace instead', () => {
    renderCard();

    expect(
      screen.getByRole('link', { name: 'Create a Workspace' }),
    ).toHaveAttribute('href', '/register/create-workspace');
  });

  it('says why when it could not open one', async () => {
    switchWorkspace.mockResolvedValue({
      ok: false,
      message: "You're no longer in that Workspace.",
    });
    const user = renderCard();

    await user.click(screen.getByRole('button', { name: 'Acme' }));

    expect(toast.error).toHaveBeenCalledWith(
      "You're no longer in that Workspace.",
    );
  });
});
