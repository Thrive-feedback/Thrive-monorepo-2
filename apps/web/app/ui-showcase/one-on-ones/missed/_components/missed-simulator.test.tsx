import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MissedCaseTable } from './missed-case-table';
import { MissedSimulator } from './missed-simulator';

/** Sets the simulator's day to `days` after Tue 1 Dec, as dragging the day does. */
function dayAt(days: number) {
  fireEvent.change(screen.getByRole('slider', { name: 'Today' }), {
    target: { value: String(days) },
  });
}

describe('MissedSimulator', () => {
  it('turns a meeting overdue the day after, then skipped as the next one comes, its agenda carried', async () => {
    render(<MissedSimulator />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Write a topic' }),
    );
    expect(screen.getByText('Launch retro')).toBeVisible();

    dayAt(1);
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(screen.getByText('Weekly · was Tue 1 Dec')).toBeVisible();

    dayAt(7);
    expect(screen.getByText('From Tue 1 Dec (skipped)')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: /Past meetings/ }));
    expect(screen.getByText('Skipped')).toBeVisible();
  });

  it('holds a late meeting for the missed day, and keeps the schedule', async () => {
    render(<MissedSimulator />);

    dayAt(3);
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(
      screen.getByText('Tue 1 Dec meeting, started Fri 4 Dec'),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(screen.getByText('Weekly · Next Tue 8 Dec')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: /Past meetings/ }));
    expect(screen.getByText(/Held late, Fri 4 Dec/)).toBeVisible();
  });

  it('offers only what may be done: no Finish before a start, no Start once started', async () => {
    render(<MissedSimulator />);

    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'End schedule' })).toBeDisabled();
  });
});

describe('MissedCaseTable', () => {
  it('draws every cadence with its cases', () => {
    render(<MissedCaseTable />);

    for (const name of ['Weekly', 'Every 2 weeks', 'Monthly', 'Once']) {
      const section = screen.getByRole('region', {
        name: new RegExp(`^${name}`),
      });
      expect(within(section).getAllByRole('figure').length).toBeGreaterThan(5);
    }
  });
});
