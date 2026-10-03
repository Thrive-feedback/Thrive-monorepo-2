import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RootError from './error';

describe('RootError', () => {
  it("retries the failed part and shows the failure's digest", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const error = Object.assign(new Error('API unreachable'), {
      digest: 'abc123',
    });

    render(<RootError error={error} retry={retry} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Reference: abc123')).toBeInTheDocument();
    // The message stays on the server: it may describe the inside of the system.
    expect(screen.queryByText(/API unreachable/)).toBeNull();
  });
});
