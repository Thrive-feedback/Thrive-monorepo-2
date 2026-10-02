import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from './text-field';

describe('TextField', () => {
  it('is named by its label and described by its helper text', () => {
    render(
      <TextField
        label="Display name"
        helperText="Shown on your Kudo cards."
        required
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Display name' });

    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('Shown on your Kudo cards.');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('announces its error in place of the helper text', () => {
    render(
      <TextField
        label="Email"
        helperText="Your work address."
        errorMessage="Enter an email address."
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Enter an email address.');
    expect(screen.queryByText('Your work address.')).not.toBeInTheDocument();
  });

  it('is focused from its label and takes typing', async () => {
    const user = userEvent.setup();
    render(<TextField label="Full name" />);

    await user.click(screen.getByText('Full name'));
    await user.keyboard('Tony Stark');

    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue(
      'Tony Stark',
    );
  });
});
