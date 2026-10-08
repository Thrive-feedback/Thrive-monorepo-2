import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('takes typing, and cannot be typed into while disabled', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Input aria-label="Name" />
        <Input aria-label="Email" disabled />
      </>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Tony');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'x');

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Tony');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('');
  });

  it('keeps its design size and variant off the native element', () => {
    render(<Input aria-label="Name" size="sm" variant="filled" />);
    const input = screen.getByRole('textbox', { name: 'Name' });

    expect(input).not.toHaveAttribute('size');
    expect(input).not.toHaveAttribute('variant');
  });
});
