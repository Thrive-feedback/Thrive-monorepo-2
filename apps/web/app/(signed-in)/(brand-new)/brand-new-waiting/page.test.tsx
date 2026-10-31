import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BrandNewWaiting from './page';

const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';

vi.mock('@/lib/session/session.service', () => ({
  requireMember: async () => ({
    membership: { workspace: { id: 'w-1', name: 'Acme' }, role: 'MEMBER' },
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('./_components/waiting-asks', () => ({
  WaitingAsks: ({ sort }: { sort: string }) => <p>The list, {sort} first</p>,
  WaitingAsksSkeleton: () => null,
}));
vi.mock('./_components/waiting-postcard', () => ({
  WaitingPostcard: ({ askId }: { askId: string }) => (
    <p>The postcard {askId}</p>
  ),
}));

function open(searchParams: Record<string, string> = {}) {
  return BrandNewWaiting({ searchParams: Promise.resolve(searchParams) });
}

describe('BrandNewWaiting', () => {
  it('is titled Waiting for me, over the list', async () => {
    render(await open());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Waiting for me' }),
    ).toBeVisible();
    expect(screen.getByText('The list, newest first')).toBeVisible();
    expect(screen.queryByText(/The postcard/)).not.toBeInTheDocument();
  });

  it('reads in the order the address names', async () => {
    render(await open({ sort: 'oldest' }));

    expect(screen.getByText('The list, oldest first')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveTextContent(
      'Oldest first',
    );
  });

  it('opens the Ask the address names', async () => {
    render(await open({ ask: ASK_ID }));

    expect(await screen.findByText(`The postcard ${ASK_ID}`)).toBeVisible();
  });
});
