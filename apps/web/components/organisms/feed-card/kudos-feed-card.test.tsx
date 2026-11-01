import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { KudosFeedCard } from './kudos-feed-card';

const READER = 'reader';

const person = (accountId: string, name: string | null) => ({
  accountId,
  name,
  photoUrl: null,
  inactive: false,
});

const kudos = (overrides: Partial<ReadKudos> = {}): ReadKudos => ({
  id: 'k1',
  giver: person('mali', 'Mali Chaiyo'),
  recipients: [person('ben', 'Ben Wong')],
  message: 'Thank you for the handover.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  drawing: {
    templateKey: 'cobalt-dash',
    textStyle: {
      font: 'signature',
      sizeStep: 4,
      align: 'center',
      ink: 'paper',
    },
    stickers: [],
  },
  ...overrides,
});

function draw(item: ReadKudos) {
  render(<KudosFeedCard kudos={item} readerAccountId={READER} />);
  return screen.getByRole('article');
}

describe('a Kudos on Home', () => {
  it('says who gave it to whom', () => {
    const card = draw(kudos());

    expect(within(card).getByText('Mali Chaiyo')).toBeVisible();
    expect(within(card).getByText('gave kudos')).toBeVisible();
    expect(within(card).getByText('Ben Wong')).toBeVisible();
  });

  it('says you where it names the reader', () => {
    const card = draw(
      kudos({
        giver: person(READER, 'Ann Lee'),
        recipients: [person('ben', 'Ben Wong')],
      }),
    );

    expect(card).toHaveTextContent('Yougave kudos');
  });

  it('says you when it was given to the reader', () => {
    const card = draw(kudos({ recipients: [person(READER, 'Ann Lee')] }));

    expect(within(card).getByText('you')).toBeVisible();
  });

  it('says a Kudos naming nobody is for the whole Workspace', () => {
    const card = draw(kudos({ recipients: [] }));

    expect(within(card).getByText('the whole Workspace')).toBeVisible();
  });

  it('says what it is and when', () => {
    const card = draw(kudos());

    expect(within(card).getByText('Kudos')).toBeVisible();
    expect(card.querySelector('time')).toBeInTheDocument();
  });

  it('shows the whole card', () => {
    draw(kudos());

    expect(screen.getByText('Thank you for the handover.')).toBeVisible();
  });

  it('hangs the cards beside it out of reach of a screen reader', () => {
    const card = draw(kudos());

    expect(within(card).getAllByRole('button')).toHaveLength(1);
    expect(screen.getAllByText(/Thank you/)).toHaveLength(1);
  });

  it('opens large from View kudos', async () => {
    const user = userEvent.setup();
    draw(kudos());

    await user.click(screen.getByRole('button', { name: 'View kudos' }));

    expect(
      screen.getByRole('dialog', { name: 'Kudos from Mali Chaiyo' }),
    ).toBeVisible();
  });

  describe('as the cursor comes onto the card', () => {
    function theCard() {
      return screen
        .getByText('Thank you for the handover.')
        .closest('[style*="rotate"]');
    }

    function pressable() {
      const button = screen
        .getByText('Thank you for the handover.')
        .closest('[style*="rotate"]')
        ?.querySelector(':scope > button');
      if (!button) {
        throw new Error('The card has no way to be pressed.');
      }
      return button;
    }

    it('gives a little shake', async () => {
      const user = userEvent.setup();
      const animate = vi.fn(() => ({ onfinish: null }));
      Element.prototype.animate = animate as never;
      draw(kudos());

      await user.hover(pressable());

      expect(animate).toHaveBeenCalledTimes(1);
      expect(animate.mock.contexts[0]).toBe(theCard());
    });

    it('stays still for somebody who asked for less motion', async () => {
      const user = userEvent.setup();
      const animate = vi.fn(() => ({ onfinish: null }));
      Element.prototype.animate = animate as never;
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
      } as MediaQueryList);
      draw(kudos());

      await user.hover(pressable());

      expect(animate).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  it('has no Reactions', () => {
    draw(kudos());

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
