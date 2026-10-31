import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SentPostcardInput } from '@/app/(signed-in)/(brand-new)/_lib/sent-postcard.schema';
import { Toaster } from '@/components/atoms/toaster';
import { POSTCARD_STAMPS } from '@/components/organisms/postcard-dialog/postcard-stamp.constant';
import { POSTCARD_STICKERS } from '@/components/organisms/postcard-dialog/postcard-sticker.constant';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ComposeMenu } from './compose-menu';

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
  {
    accountId: 'krit',
    name: 'Krit Chan',
    email: 'krit@acme.test',
    photoUrl: null,
    slug: 'krit',
    displayName: 'Krit',
  },
];

const WRITER = { name: 'Ann', photoUrl: null };

function draw() {
  render(
    <>
      <ComposeMenu
        workspaceId={WORKSPACE_ID}
        teammates={TEAMMATES}
        workspaceGoals={[]}
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
  return screen.findByRole('dialog', {}, { timeout: 5000 });
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
  await user.click(screen.getByRole('button', { name: 'Done' }));
}

beforeEach(() => {
  sendPostcardFeedback.mockReset().mockResolvedValue({});
  sendPostcardRequest.mockReset().mockResolvedValue({});
});

// Sonner keeps its toasts between renders, so one test's would still show in the next.
afterEach(() => {
  toast.dismiss();
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
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(await screen.findByText('Feedback sent.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sendPostcardFeedback).toHaveBeenCalledWith(
      WORKSPACE_ID,
      expect.objectContaining({
        recipientAccountIds: ['mali'],
        message: 'Thank you for the demo.',
        visibility: 'EVERYONE',
        selectedAccountIds: [],
        look: expect.objectContaining({
          tone: 'cream',
          stickers: [],
          stampKey: null,
          textStyle: expect.objectContaining({ font: 'modern' }),
        }),
      }),
    );
  });

  it('sends a card the server accepts, with its sticker, stamp and Selected people', async () => {
    const [sticker] = POSTCARD_STICKERS;
    const [stamp] = POSTCARD_STAMPS;
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await writeTo(user, 'Your feedback');
    await user.click(screen.getByRole('button', { name: /^Stickers \(/ }));
    await user.click(
      screen.getByRole('button', { name: `Add the ${sticker?.alt} sticker` }),
    );
    await user.click(screen.getByRole('button', { name: 'Stamp' }));
    await user.click(
      await screen.findByRole('button', {
        name: `Use the ${stamp?.alt} stamp`,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /^Who else can read it/ }),
    );
    await user.click(screen.getByRole('radio', { name: /Selected people/ }));
    await user.click(screen.getByRole('checkbox', { name: /Krit Chan/ }));
    await user.click(screen.getByRole('button', { name: /^Done/ }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    await waitFor(() => expect(sendPostcardFeedback).toHaveBeenCalled());
    const [, sent] = sendPostcardFeedback.mock.calls[0] ?? [];
    expect(SentPostcardInput.shape.look.safeParse(sent.look).success).toBe(
      true,
    );
    expect(sent).toMatchObject({
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: ['krit'],
      look: { stampKey: stamp?.key },
    });
    expect(sent.look.stickers).toEqual([
      {
        stickerKey: sticker?.key,
        side: 'back',
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
      },
    ]);
  });

  it('gives focus back to "+" once a sent card has flown', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await writeTo(user, 'Your feedback');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Write something' }),
    ).toHaveFocus();
  });

  it('says no send failed when the session has gone and the page moves on', async () => {
    sendPostcardFeedback.mockRejectedValue(
      Object.assign(new Error('NEXT_REDIRECT'), {
        digest: 'NEXT_REDIRECT;replace;/signin;307;',
      }),
    );
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await writeTo(user, 'Your feedback');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Send feedback/ }),
      ).toBeEnabled(),
    );
    expect(
      screen.queryByText("We couldn't send your postcard. Please try again."),
    ).toBeNull();
    expect(screen.queryByText('Feedback sent.')).toBeNull();
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
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(
      await screen.findByText(
        'Someone you picked it for is no longer in your Workspace.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      'Thank you for the demo.',
    );
    expect(
      screen.getByRole('button', { name: /^Send feedback/ }),
    ).toBeEnabled();
  });

  it('keeps the card when the send cannot reach the server', async () => {
    sendPostcardFeedback.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await writeTo(user, 'Your feedback');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(
      await screen.findByText(
        "We couldn't send your postcard. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      'Thank you for the demo.',
    );
    expect(
      screen.getByRole('button', { name: /^Send feedback/ }),
    ).toBeEnabled();
  });

  it('only closes when Give kudos is chosen, since it is not built yet', async () => {
    const user = userEvent.setup();
    draw();

    await choose(user, /Give kudos/);

    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
