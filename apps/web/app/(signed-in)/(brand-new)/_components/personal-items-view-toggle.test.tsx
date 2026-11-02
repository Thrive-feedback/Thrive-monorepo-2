import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReceivedViewToggle } from './received-view-toggle';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function goTo(address: string) {
  window.history.replaceState(null, '', address);
}

beforeEach(() => {
  goTo('/brand-new-received');
});

function chooser(name: 'Grid view' | 'List view') {
  return screen.getByRole('button', { name });
}

describe('ReceivedViewToggle', () => {
  it('opens on the grid', () => {
    render(<ReceivedViewToggle />);

    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'true');
    expect(chooser('List view')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the view the address names', () => {
    goTo('/brand-new-received?view=list');

    render(<ReceivedViewToggle />);

    expect(chooser('List view')).toHaveAttribute('aria-pressed', 'true');
    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'false');
  });

  it('falls back to the grid for a view the address cannot mean', () => {
    goTo('/brand-new-received?view=table');

    render(<ReceivedViewToggle />);

    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is one named group of choices', () => {
    render(<ReceivedViewToggle />);

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  it('keeps the choice in the address', async () => {
    const user = userEvent.setup();
    render(<ReceivedViewToggle />);

    await user.click(chooser('List view'));

    expect(window.location.pathname).toBe('/brand-new-received');
    expect(window.location.search).toBe('?view=list');
  });

  it('leaves the address as it is when the view showing is pressed again', async () => {
    const user = userEvent.setup();
    goTo('/brand-new-received?view=list');
    render(<ReceivedViewToggle />);

    await user.click(chooser('List view'));

    expect(window.location.search).toBe('?view=list');
  });
});
