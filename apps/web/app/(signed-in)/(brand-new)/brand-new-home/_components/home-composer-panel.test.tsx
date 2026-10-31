import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import { ROUTES } from '@/lib/routes.constant';

const refresh = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh, push }),
  usePathname: () => ROUTES.brandNewHome,
}));
const sendKudosCard = vi.fn();
const sendPostcardFeedback = vi.fn();
const sendPostcardRequest = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service',
  () => ({
    sendKudosCard: (...args: unknown[]) => sendKudosCard(...args),
    sendPostcardFeedback: (...args: unknown[]) => sendPostcardFeedback(...args),
    sendPostcardRequest: (...args: unknown[]) => sendPostcardRequest(...args),
  }),
);

const { HomeComposerPanel } = await import('./home-composer-panel');
// Its code arrives on its own, which can outlast a test in a busy run if the first opening fetches it.
await import('@/components/organisms/postcard-dialog/postcard-dialog');
await import('@/components/organisms/kudos-dialog/kudos-dialog');

const WAITING = { timeout: 5000 };

function draw() {
  render(
    <>
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
      />
      <Toaster />
    </>,
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
  push.mockClear();
  sendKudosCard.mockReset().mockResolvedValue({});
  sendPostcardFeedback.mockReset().mockResolvedValue({});
  sendPostcardRequest.mockReset().mockResolvedValue({});
});

describe('HomeComposerPanel', () => {
  it.each([
    ['Give feedback', 'Your feedback'],
    ['Ask for feedback', 'Your request'],
    ['Give kudos', 'Your Kudos'],
  ])('carries what was typed onto the %s card', async (name, message) => {
    draw();

    await typeThenChoose(name);

    await screen.findByRole('dialog', { name });
    expect(await screen.findByRole('textbox', { name: message })).toHaveValue(
      'The demo went well.',
    );
  });

  it('sends a Kudos, and goes to the board from it', async () => {
    draw();
    await typeThenChoose('Give kudos');
    await screen.findByRole('dialog', { name: 'Give kudos' });

    await userEvent.click(
      await screen.findByRole('textbox', { name: 'Your Kudos' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(
      await screen.findByRole('button', { name: /^Send kudos/ }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Go to Kudos board' }, WAITING),
    );

    expect(sendKudosCard).toHaveBeenCalledExactlyOnceWith(
      'w-1',
      expect.objectContaining({ message: 'The demo went well.' }),
    );
    expect(push).toHaveBeenCalledExactlyOnceWith(ROUTES.brandNewKudos);
    expect(refresh).toHaveBeenCalledOnce();
    await waitFor(() => expect(field()).toHaveValue(''), WAITING);
  });

  it('stays on Home when the Giver goes back there from the board', async () => {
    draw();
    await typeThenChoose('Give kudos');
    await screen.findByRole('dialog', { name: 'Give kudos' });
    await userEvent.click(
      await screen.findByRole('textbox', { name: 'Your Kudos' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(
      await screen.findByRole('button', { name: /^Send kudos/ }),
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'Back to home' }, WAITING),
    );

    await waitFor(
      () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      WAITING,
    );
    expect(push).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('opens a blank card when nothing was typed', async () => {
    draw();

    await userEvent.click(
      screen.getByRole('button', { name: 'Give feedback' }),
    );

    expect(
      await screen.findByRole('dialog', { name: 'Give feedback' }),
    ).toBeInTheDocument();
    for (const box of screen.getAllByRole('textbox')) {
      expect(box).toHaveValue('');
    }
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
    expect(field()).toHaveFocus();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('keeps what was typed when a card fails to go', async () => {
    sendKudosCard.mockResolvedValue({ formError: 'That did not go.' });
    draw();
    await typeThenChoose('Give kudos');
    await screen.findByRole('dialog', { name: 'Give kudos' });
    await userEvent.click(
      await screen.findByRole('textbox', { name: 'Your Kudos' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await userEvent.click(
      await screen.findByRole('button', { name: /^Send kudos/ }),
    );

    expect(await screen.findByText('That did not go.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Your Kudos' })).toHaveValue(
      'The demo went well.',
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
