import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimePicker } from './time-picker';

describe('TimePicker', () => {
  it('reads like a field, and sets the hour then the minutes on Thrive’s own columns', async () => {
    const onChange = vi.fn();
    render(<TimePicker value={600} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: '10:00' }));
    const hours = await screen.findByRole('list', { name: 'Hours' });
    expect(hours).toBeVisible();
    expect(screen.getByRole('button', { name: '10 hours' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '10 hours' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: '14 hours' }));
    expect(onChange).toHaveBeenLastCalledWith(14 * 60);
    expect(screen.getByRole('list', { name: 'Minutes' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: '30 minutes' }));
    expect(onChange).toHaveBeenLastCalledWith(10 * 60 + 30);
    expect(
      screen.queryByRole('list', { name: 'Hours' }),
    ).not.toBeInTheDocument();
  });

  it('offers minutes in steps, and moves with the arrow keys', async () => {
    render(<TimePicker value={null} onChange={vi.fn()} stepMinutes={15} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Choose a time' }),
    );
    const minutes = await screen.findByRole('list', { name: 'Minutes' });
    expect(
      [...minutes.querySelectorAll('button')].map(
        (button) => button.textContent,
      ),
    ).toEqual(['00', '15', '30', '45']);
    expect(screen.getByRole('button', { name: '00 hours' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('button', { name: '02 hours' })).toHaveFocus();
  });

  it('is named by its label and the time chosen together', () => {
    render(
      <>
        <span id="time-label">Time</span>
        <TimePicker
          value={630}
          onChange={vi.fn()}
          aria-labelledby="time-label"
        />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Time 10:30' })).toBeVisible();
  });
});
