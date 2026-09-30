import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './checkbox';
import { Label } from './label';

function Labelled(props: React.ComponentProps<typeof Checkbox>) {
  return (
    <div>
      <Checkbox id="terms" {...props} />
      <Label htmlFor="terms">Accept the terms</Label>
    </div>
  );
}

describe('Checkbox', () => {
  it('is named by its label and toggles from the pointer and the keyboard', async () => {
    const user = userEvent.setup();
    render(<Labelled />);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept the terms' });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.keyboard(' ');
    expect(checkbox).not.toBeChecked();
  });

  it('toggles when its label is clicked', async () => {
    const user = userEvent.setup();
    render(<Labelled />);

    await user.click(screen.getByText('Accept the terms'));

    expect(
      screen.getByRole('checkbox', { name: 'Accept the terms' }),
    ).toBeChecked();
  });

  it('announces a partly chosen group as mixed', () => {
    render(<Labelled checked="indeterminate" />);

    expect(
      screen.getByRole('checkbox', { name: 'Accept the terms' }),
    ).toHaveAttribute('aria-checked', 'mixed');
  });

  it('cannot be changed while disabled', async () => {
    const user = userEvent.setup();
    render(<Labelled disabled />);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept the terms' });

    await user.click(checkbox);

    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
  });
});
