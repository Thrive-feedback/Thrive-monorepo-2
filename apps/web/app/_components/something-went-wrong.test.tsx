import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SomethingWentWrong } from './something-went-wrong';

describe('SomethingWentWrong', () => {
  it('says the page could not load and offers to try again', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<SomethingWentWrong onRetry={onRetry} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the reference a person can quote', () => {
    render(<SomethingWentWrong digest="1234567890" onRetry={vi.fn()} />);

    expect(screen.getByText('Reference: 1234567890')).toBeInTheDocument();
  });

  it('shows no reference when there is none', () => {
    render(<SomethingWentWrong onRetry={vi.fn()} />);

    expect(screen.queryByText(/Reference:/)).toBeNull();
  });
});
