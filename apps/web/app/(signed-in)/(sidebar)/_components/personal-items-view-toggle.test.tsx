import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PersonalItemsViewToggle } from './personal-items-view-toggle';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function goTo(address: string) {
  window.history.replaceState(null, '', address);
}

beforeEach(() => {
  goTo('/received');
});

function chooser(name: 'List view' | 'Grid view') {
  return screen.getByRole('button', { name });
}

describe('PersonalItemsViewToggle', () => {
  it('opens on the list', () => {
    render(<PersonalItemsViewToggle side="received" />);

    expect(chooser('List view')).toHaveAttribute('aria-pressed', 'true');
    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the view the address names', () => {
    goTo('/received?view=grid');

    render(<PersonalItemsViewToggle side="received" />);

    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'true');
    expect(chooser('List view')).toHaveAttribute('aria-pressed', 'false');
  });

  it('falls back to the list for a view the address cannot mean', () => {
    goTo('/received?view=table');

    render(<PersonalItemsViewToggle side="received" />);

    expect(chooser('List view')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is one named group of choices', () => {
    render(<PersonalItemsViewToggle side="received" />);

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  it('keeps the choice in the address', async () => {
    const user = userEvent.setup();
    render(<PersonalItemsViewToggle side="received" />);

    await user.click(chooser('Grid view'));

    expect(window.location.pathname).toBe('/received');
    expect(window.location.search).toBe('?view=grid');
  });

  it("keeps Given's choice in Given's address", async () => {
    const user = userEvent.setup();
    goTo('/given');
    render(<PersonalItemsViewToggle side="given" />);

    await user.click(chooser('Grid view'));

    expect(window.location.pathname).toBe('/given');
    expect(window.location.search).toBe('?view=grid');
  });

  it('leaves the address as it is when the view showing is pressed again', async () => {
    const user = userEvent.setup();
    goTo('/received?view=grid');
    render(<PersonalItemsViewToggle side="received" />);

    await user.click(chooser('Grid view'));

    expect(window.location.search).toBe('?view=grid');
  });
});
