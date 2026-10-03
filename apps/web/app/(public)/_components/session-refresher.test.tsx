import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionRefresher } from './session-refresher';

const refreshSession = vi.fn(async () => {});
vi.mock('@/app/(public)/_lib/session-actions.service', () => ({
  refreshSession: () => refreshSession(),
}));

describe('SessionRefresher', () => {
  it('refreshes the session once, however often it renders again', () => {
    const { rerender } = render(<SessionRefresher />);
    rerender(<SessionRefresher />);
    rerender(<SessionRefresher />);

    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('renders nothing', () => {
    const { container } = render(<SessionRefresher />);

    expect(container).toBeEmptyDOMElement();
  });
});
