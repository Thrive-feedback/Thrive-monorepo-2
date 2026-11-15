import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SIDEBAR_STORAGE_KEY } from '@/lib/sidebar-fold.constant';
import { SidebarFoldToggle } from './sidebar-fold-toggle';

/** A window narrower than `xl`, where the sidebar starts as a rail. */
function tablet() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  tablet();
  document.documentElement.dataset.sidebar = 'rail';
});

afterEach(() => {
  const root = document.documentElement;
  delete root.dataset.sidebar;
  delete root.dataset.sidebarLocked;
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('SidebarFoldToggle', () => {
  it('on the rail, offers to expand the sidebar it controls', () => {
    render(<SidebarFoldToggle inSettings={false} />);

    const button = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'sidebar');
  });

  it('widens the sidebar when pressed, remembers it, and then offers to collapse it', async () => {
    const user = userEvent.setup();
    render(<SidebarFoldToggle inSettings={false} />);

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    expect(document.documentElement.dataset.sidebar).toBe('wide');
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('wide');
    const button = await screen.findByRole('button', {
      name: 'Collapse sidebar',
    });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveFocus();
  });

  it('folds a wide sidebar back to its rail', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.sidebar = 'wide';
    render(<SidebarFoldToggle inSettings={false} />);

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(document.documentElement.dataset.sidebar).toBe('rail');
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('rail');
  });

  it('keeps the rail in Settings below xl, where there is no room to widen it', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.sidebarLocked = '';
    render(<SidebarFoldToggle inSettings />);

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    expect(document.documentElement.dataset.sidebar).toBe('rail');
    expect(document.documentElement.dataset.sidebarLocked).toBe('');
  });
});
