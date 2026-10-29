import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ComposeMenu } from './compose-menu';

describe('ComposeMenu', () => {
  it('offers the three things to write, each saying what it is for', async () => {
    const user = userEvent.setup();
    render(<ComposeMenu />);

    await user.click(screen.getByRole('button', { name: 'Write something' }));

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual([
      'Ask for feedbackAsk teammates what they think.',
      "Give feedbackTell a teammate what you've seen.",
      'Give kudosSay well done in a few words.',
    ]);
  });

  it('only closes when one is chosen, since none is built yet', async () => {
    const user = userEvent.setup();
    render(<ComposeMenu />);

    await user.click(screen.getByRole('button', { name: 'Write something' }));
    await user.click(screen.getByRole('menuitem', { name: /Give kudos/ }));

    expect(screen.queryByRole('menu')).toBeNull();
  });
});
