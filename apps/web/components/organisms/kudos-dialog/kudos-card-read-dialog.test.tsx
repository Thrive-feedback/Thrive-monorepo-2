import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { KudosCardReadDialog } from './kudos-card-read-dialog';
import type { ReadKudos } from './read-kudos.type';

const person = (accountId: string, name: string | null) => ({
  accountId,
  name,
  photoUrl: null,
  inactive: false,
});

const KUDOS: ReadKudos = {
  id: 'k1',
  giver: person('mali', 'Mali Chaiyo'),
  recipients: [person('ben', 'Ben Wong')],
  message: 'Thank you for the handover.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  drawing: {
    templateKey: 'sky-note',
    textStyle: { font: 'signature', sizeStep: 2, align: 'center', ink: 'navy' },
    stickers: [
      {
        stickerKey: 'system/sticker-01-thumbs-up',
        x: 50,
        y: 70,
        scale: 1,
        rotation: 0,
        side: 'back',
      },
    ],
  },
};

function draw(kudos: ReadKudos = KUDOS, onOpenChange = vi.fn()) {
  render(
    <KudosCardReadDialog kudos={kudos} open onOpenChange={onOpenChange} />,
  );
  return screen.getByRole('dialog');
}

function finishTurning() {
  const card = screen.getByText('31 October 2026').closest('.grid');
  if (card) {
    fireEvent.animationEnd(card);
    fireEvent.animationEnd(card);
  }
}

describe('reading a Kudos card large', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('says whose it is, and shows the words', () => {
    draw();

    expect(
      screen.getByRole('dialog', { name: 'Kudos from Mali Chaiyo' }),
    ).toBeVisible();
    expect(screen.getByText('Thank you for the handover.')).toBeVisible();
  });

  it('shows who gave it to whom under the card', () => {
    const dialog = draw();

    expect(within(dialog).getByText('Mali Chaiyo')).toBeVisible();
    expect(within(dialog).getByText('Ben Wong')).toBeVisible();
  });

  it('says a Kudos naming nobody is for the whole Workspace', () => {
    const dialog = draw({ ...KUDOS, recipients: [] });

    expect(within(dialog).getByText('the whole Workspace')).toBeVisible();
  });

  it('turns over to the day it was given', async () => {
    const user = userEvent.setup();
    draw();

    await user.click(
      screen.getByRole('button', { name: /^Turn over to the back/ }),
    );
    finishTurning();

    expect(screen.getByRole('img', { name: 'Thrive' })).toBeVisible();
    expect(screen.getByText('31 October 2026')).toBeVisible();
  });

  it('clears the stickers away and puts them back', async () => {
    const user = userEvent.setup();
    draw();
    const sticker = () => screen.queryByRole('img', { name: /sticker$/ });

    expect(sticker()).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Hide stickers/ }));
    expect(sticker()).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Show stickers/ }));
    expect(sticker()).toBeInTheDocument();
  });

  it('offers to hide its tip while the card has stickers to say it about', async () => {
    const user = userEvent.setup();
    draw();
    expect(screen.getByText('hide the stickers here')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide tips' }));

    expect(
      screen.queryByText('hide the stickers here'),
    ).not.toBeInTheDocument();
  });

  it('has no tips to hide on a card with no stickers', () => {
    draw({ ...KUDOS, drawing: { ...KUDOS.drawing, stickers: [] } });

    expect(screen.getByRole('button', { name: 'Hide tips' })).toBeDisabled();
  });

  it('closes at once', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    draw(KUDOS, onOpenChange);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
