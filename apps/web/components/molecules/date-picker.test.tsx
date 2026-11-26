import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './date-picker';

describe('DatePicker', () => {
  it('reads like a field, and opens Thrive’s calendar to choose a day', async () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        value="2026-12-02"
        onChange={onChange}
        today="2026-11-26"
        min="2026-11-26"
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Wed, 2 Dec 2026/ }),
    );
    expect(
      await screen.findByRole('table', { name: 'December 2026' }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Friday, 4 December 2026' }),
    );

    expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-12-04');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('offers Today, and Clear for a day that may be left out', async () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        value={null}
        onChange={onChange}
        today="2026-11-26"
        placeholder="Due (optional)"
        clearable
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Due/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-26');

    await userEvent.click(screen.getByRole('button', { name: /Due/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('is named by its label and the day chosen together', () => {
    render(
      <>
        <span id="date-label">Date</span>
        <DatePicker
          value="2026-12-02"
          onChange={vi.fn()}
          aria-labelledby="date-label"
        />
      </>,
    );

    expect(
      screen.getByRole('button', { name: 'Date Wed, 2 Dec 2026' }),
    ).toBeVisible();
  });
});
