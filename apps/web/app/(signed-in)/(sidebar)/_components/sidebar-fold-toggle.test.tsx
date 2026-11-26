import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MD_AND_UP } from '@/lib/breakpoint.constant';
import {
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_TABLET_STORAGE_KEY,
} from '@/lib/sidebar-fold.constant';
import { SidebarFoldToggle } from './sidebar-fold-toggle';

/** A window that matches the queries `matches` says it does. */
function windowMatching(matches: (query: string) => boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches(query),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  // A desktop, at `xl` or wider, where the person's choice holds.
  windowMatching(() => true);
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
    render(<SidebarFoldToggle />);

    const button = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'sidebar');
  });

  it('widens the sidebar when pressed, remembers it, and then offers to collapse it', async () => {
    const user = userEvent.setup();
    render(<SidebarFoldToggle />);

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
    render(<SidebarFoldToggle />);

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(document.documentElement.dataset.sidebar).toBe('rail');
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('rail');
  });

  it('widens the rail on a tablet too, and remembers it for a tablet alone', async () => {
    const user = userEvent.setup();
    windowMatching((query) => query === MD_AND_UP);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'rail');
    render(<SidebarFoldToggle />);

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    expect(document.documentElement.dataset.sidebar).toBe('wide');
    expect(document.documentElement.dataset.sidebarLocked).toBeUndefined();
    expect(localStorage.getItem(SIDEBAR_TABLET_STORAGE_KEY)).toBe('wide');
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('rail');
  });
});
