import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationList, IntegrationListSkeleton } from './integration-list';

const readConnections = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/connections.service',
  () => ({ readConnections: (...args: unknown[]) => readConnections(...args) }),
);
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/integration-actions.service',
  () => ({
    beginInstall: vi.fn(),
    chooseChannel: vi.fn(),
    disconnectIntegration: vi.fn(),
  }),
);

import type { CurrentMembership } from '@/lib/session/current-account.type';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const ADMIN: CurrentMembership = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'ADMIN',
};

const MEMBER: CurrentMembership = { ...ADMIN, role: 'MEMBER' };

const DISCORD = {
  provider: 'DISCORD',
  spaceName: 'Acme HQ',
  channelName: 'standups',
  connectedBy: 'Ann',
  connectedAt: '2026-10-18T03:00:00.000Z',
} as const;

beforeEach(() => {
  readConnections.mockReset();
});

async function renderList(membership = ADMIN) {
  render(await IntegrationList({ membership }));
}

describe('IntegrationList', () => {
  it('names every chat tool a Workspace can connect, even before anything is read', () => {
    render(<IntegrationListSkeleton />);

    expect(screen.getByText('Discord')).toBeInTheDocument();
  });

  it('says what connecting would do while nothing is connected, and offers an Admin the way', async () => {
    readConnections.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Connect Discord' }),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .hover(screen.getByRole('button', { name: 'About Discord' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Thrive posts Kudos, and Feedback shared with everyone in the Workspace, in one Discord channel an Admin picks. It also lets teammates who link their own Discord get direct messages.',
    );
  });

  it('offers a Member nothing to connect', async () => {
    readConnections.mockResolvedValue([]);

    await renderList(MEMBER);

    expect(
      screen.queryByRole('button', { name: 'Connect Discord' }),
    ).toBeNull();
  });

  it('says only that it is connected, with where it posts in its menu', async () => {
    readConnections.mockResolvedValue([DISCORD]);

    await renderList();

    expect(screen.getByText('Connected')).toHaveClass(
      'text-status-success-active',
    );
    expect(screen.queryByText(/#standups/)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Manage Discord connection' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Connect Discord' }),
    ).toBeNull();
  });

  it('gives a Member the menu too, so they can see where their Workspace posts', async () => {
    readConnections.mockResolvedValue([DISCORD]);

    await renderList(MEMBER);

    expect(
      screen.getByRole('button', { name: 'Manage Discord connection' }),
    ).toBeInTheDocument();
  });
});
