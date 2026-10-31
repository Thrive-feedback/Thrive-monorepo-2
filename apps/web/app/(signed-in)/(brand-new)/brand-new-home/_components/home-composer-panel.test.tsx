import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh }),
}));
const sendPostcardFeedback = vi.fn();
const sendPostcardRequest = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: (...args: unknown[]) => sendPostcardFeedback(...args),
    sendPostcardRequest: (...args: unknown[]) => sendPostcardRequest(...args),
  }),
);
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const { HomeComposerPanel } = await import('./home-composer-panel');
// Its code arrives on its own, which can outlast a test in a busy run if the first opening fetches it.
await import('@/components/organisms/postcard-dialog/postcard-dialog');

const WAITING = { timeout: 5000 };

function draw() {
  render(
    <HomeComposerPanel
      workspaceId="w-1"
      teammates={[
        {
          accountId: 'mali',
          name: 'Mali Sombat',
          displayName: 'Mali',
          email: 'mali@acme.test',
          photoUrl: null,
          slug: 'mali',
        },
      ]}
      workspaceGoals={[]}
      writer={{ name: 'Dao', photoUrl: null }}
    />,
  );
}

const field = () =>
  screen.getByRole('combobox', { name: 'What you want to say' });

async function typeThenChoose(name: string) {
  await userEvent.type(field(), 'The demo went well.');
  await userEvent.click(screen.getByRole('button', { name }));
}

beforeEach(() => {
  refresh.mockClear();
  sendPostcardFeedback.mockReset().mockResolvedValue({});
  sendPostcardRequest.mockReset().mockResolvedValue({});
});

describe('HomeComposerPanel', () => {
  it.each([
    ['Give feedback', 'Your feedback'],
    ['Ask for feedback', 'Your request'],
  ])('carries what was typed onto the %s card', async (name) => {
    draw();

    await typeThenChoose(name);

    expect(await screen.findByRole('dialog', { name })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('textbox')
        .some(
          (box) => (box as HTMLTextAreaElement).value === 'The demo went well.',
        ),
    ).toBe(true);
  });

  it('opens a blank card when nothing was typed', async () => {
    draw();

    await userEvent.click(
      screen.getByRole('button', { name: 'Give feedback' }),
    );

    expect(
      await screen.findByRole('dialog', { name: 'Give feedback' }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('textbox')
        .every((box) => (box as HTMLTextAreaElement).value === ''),
    ).toBe(true);
  });

  it('clears the field and reads the page again once a card has gone', async () => {
    draw();
    await typeThenChoose('Give feedback');
    await screen.findByRole('dialog', { name: 'Give feedback' });

    await userEvent.click(
      screen.getByRole('button', { name: /^Choose who it's for/ }),
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: /Mali Sombat/ }),
    );
    await userEvent.click(screen.getByRole('button', { name: /^Done/ }));
    await userEvent.click(
      await screen.findByRole('button', { name: /Send feedback/ }),
    );

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce(), WAITING);
    await waitFor(
      () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      WAITING,
    );
    expect(sendPostcardFeedback).toHaveBeenCalledExactlyOnceWith(
      'w-1',
      expect.objectContaining({ message: 'The demo went well.' }),
    );
    expect(field()).toHaveValue('');
  });

  it('keeps what was typed when the card is closed without sending', async () => {
    draw();
    await typeThenChoose('Give feedback');
    await screen.findByRole('dialog', { name: 'Give feedback' });

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Discard' }),
    );

    await waitFor(
      () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      WAITING,
    );
    expect(field()).toHaveValue('The demo went well.');
    expect(refresh).not.toHaveBeenCalled();
  });
});
