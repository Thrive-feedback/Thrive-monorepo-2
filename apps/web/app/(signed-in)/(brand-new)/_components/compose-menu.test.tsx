import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ComposeMenu } from './compose-menu';

const sendPostcardFeedback = vi.fn();
const sendPostcardRequest = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: (...args: unknown[]) => sendPostcardFeedback(...args),
    sendPostcardRequest: (...args: unknown[]) => sendPostcardRequest(...args),
  }),
);

const WORKSPACE_ID = 'workspace-acme';

const TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    photoUrl: null,
    slug: 'mali',
    displayName: 'Mali',
  },
];

const WRITER = { name: 'Ann', photoUrl: null };

function draw() {
  render(
    <>
      <ComposeMenu
        workspaceId={WORKSPACE_ID}
        teammates={TEAMMATES}
        writer={WRITER}
      />
      <Toaster />
    </>,
  );
}

async function choose(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('button', { name: 'Write something' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

/** Chooses a card to write; its code arrives on demand, so this waits for the card itself. */
async function openPostcard(
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp,
) {
  await choose(user, name);
  return screen.findByRole('dialog');
}

/** Addresses a card to Mali and writes on it, up to the moment of sending. */
async function writeTo(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  await user.click(
    screen.getByRole('button', { name: /^Choose who (it's for|to ask)/ }),
  );
  await user.click(screen.getByRole('checkbox', { name: /Mali Sombat/ }));
  await user.click(screen.getByRole('button', { name: /^Done/ }));
  await user.type(
    screen.getByRole('textbox', { name: label }),
    'Thank you for the demo.',
  );
}

beforeEach(() => {
  sendPostcardFeedback.mockReset().mockResolvedValue({});
  sendPostcardRequest.mockReset().mockResolvedValue({});
});

describe('ComposeMenu', () => {
  it('offers the three things to write, each saying what it is for', async () => {
    const user = userEvent.setup();
    draw();

    await user.click(screen.getByRole('button', { name: 'Write something' }));

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual([
      'Ask for feedbackAsk teammates what they think.',
      "Give feedbackTell a teammate what you've seen.",
      'Give kudosSay well done in a few words.',
    ]);
  });

  it('opens the postcard titled by the choice, with the focus on the card', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);

    const dialog = screen.getByRole('dialog', { name: 'Give feedback' });
    expect(within(dialog).getByText('Ann')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /^Choose who it's for/ }),
    ).toHaveFocus();
  });

  it('opens the request postcard to ask for feedback', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Ask for feedback/);

    const dialog = screen.getByRole('dialog', { name: 'Ask for feedback' });
    expect(
      within(dialog).getByRole('textbox', { name: 'Your request' }),
    ).toBeInTheDocument();
  });

  it('gives focus back to "+" once the postcard is closed', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Write something' }),
    ).toHaveFocus();
  });

  it('sends Feedback with the card it was written on, then says it went', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await writeTo(user, 'Your feedback');
    await user.click(screen.getByRole('button', { name: /Seal & Send/ }));

    expect(await screen.findByText('Feedback sent.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sendPostcardFeedback).toHaveBeenCalledWith(
      WORKSPACE_ID,
      expect.objectContaining({
        recipientAccountIds: ['mali'],
        message: 'Thank you for the demo.',
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        look: expect.objectContaining({
          tone: 'cream',
          stamps: [],
          textStyle: expect.objectContaining({ font: 'modern' }),
        }),
      }),
    );
  });

  it('sends a request as a request, then says it went', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Ask for feedback/);
    await writeTo(user, 'Your request');
    await user.click(screen.getByRole('button', { name: /Send request/ }));

    expect(await screen.findByText('Request sent.')).toBeInTheDocument();
    expect(sendPostcardRequest).toHaveBeenCalledTimes(1);
    expect(sendPostcardFeedback).not.toHaveBeenCalled();
  });

  it('keeps the card and says why when the send is refused', async () => {
    sendPostcardFeedback.mockResolvedValue({
      formError: 'Someone you picked it for is no longer in your Workspace.',
    });
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await writeTo(user, 'Your feedback');
    await user.click(screen.getByRole('button', { name: /Seal & Send/ }));

    expect(
      await screen.findByText(
        'Someone you picked it for is no longer in your Workspace.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      'Thank you for the demo.',
    );
    expect(screen.getByRole('button', { name: /Seal & Send/ })).toBeEnabled();
  });

  it('keeps the card when the send cannot reach the server', async () => {
    sendPostcardFeedback.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await writeTo(user, 'Your feedback');
    await user.click(screen.getByRole('button', { name: /Seal & Send/ }));

    expect(
      await screen.findByText(
        "We couldn't send your postcard. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      'Thank you for the demo.',
    );
    expect(screen.getByRole('button', { name: /Seal & Send/ })).toBeEnabled();
  });

  it('only closes when Give kudos is chosen, since it is not built yet', async () => {
    const user = userEvent.setup();
    draw();

    await choose(user, /Give kudos/);

    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
