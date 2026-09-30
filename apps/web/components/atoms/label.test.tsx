import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Label } from './label';

describe('Label', () => {
  it('names the control it points at', () => {
    render(
      <>
        <Label htmlFor="nickname">Nickname</Label>
        <input id="nickname" />
      </>,
    );

    expect(
      screen.getByRole('textbox', { name: 'Nickname' }),
    ).toBeInTheDocument();
  });

  it('moves focus to its control when clicked', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="nickname">Nickname</Label>
        <input id="nickname" />
      </>,
    );

    await user.click(screen.getByText('Nickname'));

    expect(screen.getByRole('textbox', { name: 'Nickname' })).toHaveFocus();
  });
});
