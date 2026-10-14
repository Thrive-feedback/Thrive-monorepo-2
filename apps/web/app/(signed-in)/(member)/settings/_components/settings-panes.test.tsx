import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanes } from './settings-panes';

const pathname = vi.fn(() => '/settings');
vi.mock('next/navigation', () => ({ usePathname: () => pathname() }));

describe('SettingsPanes', () => {
  it('lists every section, for every Member', () => {
    render(<SettingsPanes>section</SettingsPanes>);

    const menu = screen.getByRole('navigation', { name: 'Settings' });
    expect(
      [...menu.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    ).toEqual([
      '/settings/account',
      '/settings/workspace',
      '/settings/appearance',
    ]);
  });

  it('marks Account on the landing, since that is what it shows', () => {
    pathname.mockReturnValue('/settings');
    render(<SettingsPanes>section</SettingsPanes>);

    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
  });

  it('marks the open section, and offers the way back to the menu', () => {
    pathname.mockReturnValue('/settings/appearance');
    render(<SettingsPanes>section</SettingsPanes>);

    expect(screen.getByRole('link', { name: 'Appearance' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Account' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });
});
