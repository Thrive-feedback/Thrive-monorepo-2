import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationList, IntegrationListSkeleton } from './integration-list';

const readConnections = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/connections.service',
  () => ({ readConnections: (...args: unknown[]) => readConnections(...args) }),
);
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-actions.service',
  () => ({
    beginInstall: vi.fn(),
    chooseChannel: vi.fn(),
    disconnectIntegration: vi.fn(),
  }),
);

import type { CurrentMembership } from '@/lib/session/current-account.type';

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

  it('shows the channel and server it posts in, with who connected it and when', async () => {
    readConnections.mockResolvedValue([DISCORD]);

    await renderList();

    expect(screen.getByText(/#standups in Acme HQ/)).toHaveTextContent(
      '#standups in Acme HQ · connected by Ann · 18 Oct 2026',
    );
  });

  it('says what connecting would do while nothing is connected', async () => {
    readConnections.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByText(
        'Not connected. Feedback shown to the whole Workspace can be announced in one channel.',
      ),
    ).toBeInTheDocument();
  });

  it('offers an Admin the way to connect a tool that is not connected', async () => {
    readConnections.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByRole('button', { name: 'Connect Discord' }),
    ).toBeInTheDocument();
  });

  it('tells every Member that disconnecting also stops their own messages', async () => {
    readConnections.mockResolvedValue([DISCORD]);

    await renderList(MEMBER);

    expect(
      screen.getByText(
        /Disconnecting stops this channel hearing about Feedback/,
      ),
    ).toHaveTextContent(
      'stops Thrive messaging anyone who linked their own account',
    );
  });

  it('offers an Admin the way to disconnect what is connected', async () => {
    readConnections.mockResolvedValue([DISCORD]);

    await renderList();

    expect(
      screen.getByRole('button', { name: 'Disconnect Discord' }),
    ).toBeInTheDocument();
  });

  it('offers nothing to disconnect when nothing is connected', async () => {
    readConnections.mockResolvedValue([]);

    await renderList();

    expect(
      screen.queryByRole('button', { name: 'Disconnect Discord' }),
    ).not.toBeInTheDocument();
  });

  it('offers an Admin the way to change one that is', async () => {
    readConnections.mockResolvedValue([DISCORD]);

    await renderList();

    expect(
      screen.getByRole('button', { name: 'Change Discord connection' }),
    ).toBeInTheDocument();
  });

  it('shows a Member where their Workspace posts, and no way to change it', async () => {
    readConnections.mockResolvedValue([DISCORD]);

    await renderList(MEMBER);

    expect(screen.getByText(/#standups in Acme HQ/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
