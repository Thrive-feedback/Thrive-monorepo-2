import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';

function Frequency(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Frequency" {...props}>
      {['Daily', 'Weekly', 'Monthly'].map((option) => (
        <div key={option} className="flex items-center gap-2">
          <RadioGroupItem id={option} value={option} />
          <Label htmlFor={option}>{option}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('is one named group, and choosing an option clears the others', async () => {
    const user = userEvent.setup();
    render(<Frequency defaultValue="Daily" />);

    expect(
      screen.getByRole('radiogroup', { name: 'Frequency' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Weekly' }));

    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Daily' })).not.toBeChecked();
  });

  // Radix moves focus after the keydown and chooses only while the arrow is still held, so
  // the key is held and released the way a person presses it, not tapped in one event.
  it('takes one tab stop, and the arrow keys move and choose together', async () => {
    const user = userEvent.setup();
    render(<Frequency defaultValue="Daily" />);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Daily' })).toHaveFocus();

    await user.keyboard('{ArrowDown>}');
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Weekly' })).toHaveFocus(),
    );
    await user.keyboard('{/ArrowDown}');

    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Daily' })).not.toBeChecked();
  });

  it('skips a disabled option', () => {
    render(<Frequency disabled />);

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });
});
