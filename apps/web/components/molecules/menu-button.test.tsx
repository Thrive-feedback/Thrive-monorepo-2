import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton } from './menu-button';

describe('MenuButton', () => {
  it('is a button named by its label, its picture hidden from a screen reader', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<MenuButton label="Open menu" onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
