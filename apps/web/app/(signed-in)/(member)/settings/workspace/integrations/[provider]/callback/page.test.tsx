import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntegrationCallback from './page';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));

const completeInstall = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/installs.service',
  () => ({ completeInstall: (...args: unknown[]) => completeInstall(...args) }),
);

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('not-found');
  }),
);
vi.mock('next/navigation', () => ({ notFound }));

vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_components/choose-channel-form',
  () => ({
    ChooseChannelForm: ({
      spaceName,
      installation,
    }: {
      spaceName: string;
      installation: string;
    }) => (
      <output>{`choose a channel in ${spaceName} with ${installation}`}</output>
    ),
  }),
);

const SESSION = {
  email: 'ann@acme.test',
  membership: { workspace: { id: 'w-1', name: 'Acme Corp' }, role: 'ADMIN' },
};

function callbackFrom(
  searchParams: { code?: string; state?: string },
  provider = 'discord',
) {
  return IntegrationCallback({
    params: Promise.resolve({ provider }),
    searchParams: Promise.resolve(searchParams),
  });
}

beforeEach(() => {
  requireMember.mockReset().mockResolvedValue(SESSION);
  completeInstall.mockReset();
  notFound.mockClear();
});

describe('IntegrationCallback', () => {
  it('asks which channel to post in, once the tool has said what was authorised', async () => {
    completeInstall.mockResolvedValue({
      ok: true,
      install: {
        spaceName: 'Acme HQ',
        channels: [{ id: 'channel-general', name: 'general' }],
        installation: 'signed-installation',
      },
    });

    render(await callbackFrom({ code: 'a-code', state: 'a-state' }));

    expect(completeInstall).toHaveBeenCalledWith(
      SESSION.membership,
      'DISCORD',
      'a-code',
      'a-state',
    );
    expect(
      screen.getByText('choose a channel in Acme HQ with signed-installation'),
    ).toBeInTheDocument();
  });

  it('says nothing was connected when the tool came back with nothing, and asks nobody', async () => {
    render(await callbackFrom({}));

    expect(completeInstall).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Discord did not say what was authorised, so nothing was connected.',
    );
  });

  it('says nothing was connected when the install did not start here', async () => {
    completeInstall.mockResolvedValue({
      ok: false,
      message:
        'This install did not start here, or it took too long. Nothing was connected — start again from Settings.',
    });

    render(await callbackFrom({ code: 'a-code', state: 'not-ours' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This install did not start here',
    );
    expect(
      screen.getByRole('link', { name: 'Back to Workspace' }),
    ).toHaveAttribute('href', '/settings/workspace');
  });

  it('is not a page at all for a chat tool Thrive does not connect to', async () => {
    await expect(
      callbackFrom({ code: 'a-code', state: 'a-state' }, 'teams'),
    ).rejects.toThrow('not-found');

    expect(notFound).toHaveBeenCalled();
    expect(requireMember).not.toHaveBeenCalled();
  });
});
