import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from './calendar';

describe('Calendar', () => {
  it('shows the chosen day’s month, Monday first, with today marked and the chosen day pressed', () => {
    render(
      <Calendar value="2026-12-02" onChange={vi.fn()} today="2026-12-01" />,
    );

    expect(screen.getByText('December 2026')).toBeVisible();
    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(
      screen.getByRole('button', { name: 'Wednesday, 2 December 2026' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Tuesday, 1 December 2026' }),
    ).toHaveAttribute('aria-current', 'date');
  });

  it('chooses a day, and refuses days before the first allowed', async () => {
    const onChange = vi.fn();
    render(
      <Calendar
        value={null}
        onChange={onChange}
        today="2026-11-26"
        min="2026-11-26"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Wednesday, 25 November 2026' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Previous month' }),
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Monday, 30 November 2026' }),
    );

    expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-11-30');
  });

  it('moves through days and months with the keyboard', async () => {
    const onChange = vi.fn();
    render(
      <Calendar value="2026-11-30" onChange={onChange} today="2026-11-26" />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Monday, 30 November 2026' }),
    );
    await userEvent.keyboard('{ArrowRight}');
    expect(
      screen.getByRole('button', { name: 'Tuesday, 1 December 2026' }),
    ).toHaveFocus();
    expect(screen.getByText('December 2026')).toBeVisible();
    await userEvent.keyboard('{ArrowDown}{PageUp}');
    expect(
      screen.getByRole('button', { name: 'Sunday, 8 November 2026' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenLastCalledWith('2026-11-08');
  });

  it('turns the month with its buttons', async () => {
    render(
      <Calendar value="2026-11-30" onChange={vi.fn()} today="2026-11-26" />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByText('December 2026')).toBeVisible();
  });

  it('keeps a day that may be chosen reachable by Tab after turning back into a month starting before the first allowed', async () => {
    render(
      <>
        <button type="button">Before</button>
        <Calendar
          value="2026-12-10"
          onChange={vi.fn()}
          today="2026-11-26"
          min="2026-11-26"
        />
      </>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Previous month' }),
    );
    screen.getByRole('button', { name: 'Before' }).focus();
    // Previous month is disabled now; past Next month, Tab reaches the month's one stop.
    await userEvent.tab();
    await userEvent.tab();

    expect(
      screen.getByRole('button', { name: 'Thursday, 26 November 2026' }),
    ).toHaveFocus();
  });
});
