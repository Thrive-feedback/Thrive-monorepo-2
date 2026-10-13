import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from './toggle';

describe('Toggle', () => {
  it('is announced as a pressed or unpressed button and flips on click and Space', async () => {
    const user = userEvent.setup();
    const handlePressedChange = vi.fn();
    render(<Toggle onPressedChange={handlePressedChange}>Bold</Toggle>);
    const toggle = screen.getByRole('button', { name: 'Bold' });

    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(handlePressedChange).toHaveBeenLastCalledWith(true);

    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(handlePressedChange).toHaveBeenLastCalledWith(false);
  });

  it('cannot be changed while disabled', async () => {
    const user = userEvent.setup();
    const handlePressedChange = vi.fn();
    render(
      <Toggle disabled onPressedChange={handlePressedChange}>
        Bold
      </Toggle>,
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });

    await user.click(toggle);

    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(handlePressedChange).not.toHaveBeenCalled();
  });
});
