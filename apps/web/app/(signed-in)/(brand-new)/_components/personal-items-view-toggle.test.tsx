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
  goTo('/brand-new-received');
});

function chooser(name: 'Grid view' | 'List view') {
  return screen.getByRole('button', { name });
}

describe('PersonalItemsViewToggle', () => {
  it('opens on the grid', () => {
    render(<PersonalItemsViewToggle side="received" />);

    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'true');
    expect(chooser('List view')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the view the address names', () => {
    goTo('/brand-new-received?view=list');

    render(<PersonalItemsViewToggle side="received" />);

    expect(chooser('List view')).toHaveAttribute('aria-pressed', 'true');
    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'false');
  });

  it('falls back to the grid for a view the address cannot mean', () => {
    goTo('/brand-new-received?view=table');

    render(<PersonalItemsViewToggle side="received" />);

    expect(chooser('Grid view')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is one named group of choices', () => {
    render(<PersonalItemsViewToggle side="received" />);

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  it('keeps the choice in the address', async () => {
    const user = userEvent.setup();
    render(<PersonalItemsViewToggle side="received" />);

    await user.click(chooser('List view'));

    expect(window.location.pathname).toBe('/brand-new-received');
    expect(window.location.search).toBe('?view=list');
  });

  it("keeps Given's choice in Given's address", async () => {
    const user = userEvent.setup();
    goTo('/brand-new-given');
    render(<PersonalItemsViewToggle side="given" />);

    await user.click(chooser('List view'));

    expect(window.location.pathname).toBe('/brand-new-given');
    expect(window.location.search).toBe('?view=list');
  });

  it('leaves the address as it is when the view showing is pressed again', async () => {
    const user = userEvent.setup();
    goTo('/brand-new-received?view=list');
    render(<PersonalItemsViewToggle side="received" />);

    await user.click(chooser('List view'));

    expect(window.location.search).toBe('?view=list');
  });
});
