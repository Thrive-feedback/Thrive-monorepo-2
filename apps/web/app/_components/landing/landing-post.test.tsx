import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import { LandingBoardCards } from './landing-board-cards';
import { LandingDesk } from './landing-desk';
import { LandingPost } from './landing-post';

/*
 * The desk and the board, with the real writing dialogs. Sending and pinning, closing and focus,
 * and what happens while a dialog's code is on its way are in `landing-post.dialogs.test.tsx`.
 */
function renderPage() {
  render(
    <>
      <LandingPost>
        <LandingDesk />
        <LandingBoardCards />
      </LandingPost>
      <Toaster />
    </>,
  );
}

describe('LandingPost', () => {
  it('lays three cards on the desk in the order they lie, each named for what writing it does', () => {
    renderPage();

    const desk = screen.getByRole('region', { name: 'Try it, then sign in' });
    expect(
      within(within(desk).getByRole('list'))
        .getAllByRole('button')
        .map((card) => card.getAttribute('aria-label')),
    ).toEqual(['Ask how it went', 'Say thanks', 'Give feedback unasked']);
    expect(
      within(desk).getByText('A made-up team. Nothing you write here is sent.'),
    ).toBeInTheDocument();
  });

  it('turns the fan with an arrow either side, saying which card is in front, without opening one', async () => {
    const user = userEvent.setup();
    renderPage();
    const inFront = () =>
      within(
        screen.getByRole('region', { name: 'Try it, then sign in' }),
      ).getByText(/.+/, { selector: '[aria-live]' });

    expect(inFront()).toHaveTextContent('Say thanks');
    await user.click(
      screen.getByRole('button', {
        name: 'Bring the card on the right to the front',
      }),
    );
    expect(inFront()).toHaveTextContent('Give feedback unasked');
    await user.click(
      screen.getByRole('button', {
        name: 'Bring the card on the left to the front',
      }),
    );

    expect(inFront()).toHaveTextContent('Say thanks');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('turns a card picked at the side to the front, then opens it, titled as the app titles it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ask how it went' }));

    expect(
      within(
        screen.getByRole('region', { name: 'Try it, then sign in' }),
      ).getByText(/.+/, { selector: '[aria-live]' }),
    ).toHaveTextContent('Ask how it went');
    expect(
      await screen.findByRole(
        'dialog',
        { name: 'Ask for feedback' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it('opens the card in front at once', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Say thanks' }));

    expect(
      await screen.findByRole('dialog', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('shows the made-up team’s board until the visitor pins one', () => {
    renderPage();

    expect(screen.queryByText('Yours. Only on this page.')).toBeNull();
    expect(screen.getAllByRole('figure')).toHaveLength(6);
  });
});
