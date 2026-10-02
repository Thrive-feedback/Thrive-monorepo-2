import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

function TeamSelect(props: React.ComponentProps<typeof Select>) {
  return (
    <Select {...props}>
      <SelectTrigger aria-label="Team">
        <SelectValue placeholder="Pick a team" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="engineering">Engineering</SelectItem>
        <SelectItem value="people" disabled>
          People
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

describe('Select', () => {
  it('shows its placeholder until something is chosen', () => {
    render(<TeamSelect />);

    expect(screen.getByRole('combobox', { name: 'Team' })).toHaveTextContent(
      'Pick a team',
    );
  });

  it('opens a list and takes the option that is picked', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(<TeamSelect onValueChange={handleValueChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Team' }));
    await user.click(screen.getByRole('option', { name: 'Engineering' }));

    expect(handleValueChange).toHaveBeenCalledWith('engineering');
    expect(screen.getByRole('combobox', { name: 'Team' })).toHaveTextContent(
      'Engineering',
    );
  });

  it('marks an option that cannot be picked', async () => {
    const user = userEvent.setup();
    render(<TeamSelect />);

    await user.click(screen.getByRole('combobox', { name: 'Team' }));

    expect(screen.getByRole('option', { name: 'People' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('cannot be opened while disabled', () => {
    render(<TeamSelect disabled />);

    expect(screen.getByRole('combobox', { name: 'Team' })).toBeDisabled();
  });
});
