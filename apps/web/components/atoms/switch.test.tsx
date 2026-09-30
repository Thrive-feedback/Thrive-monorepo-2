import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('announces itself as a switch and turns on and off', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();
    render(
      <Switch aria-label="Email me" onCheckedChange={handleCheckedChange} />,
    );
    const toggle = screen.getByRole('switch', { name: 'Email me' });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(handleCheckedChange).toHaveBeenLastCalledWith(true);

    await user.keyboard(' ');
    expect(toggle).not.toBeChecked();
  });

  it('cannot be changed while disabled', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Email me" disabled />);
    const toggle = screen.getByRole('switch', { name: 'Email me' });

    await user.click(toggle);

    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
  });
});
