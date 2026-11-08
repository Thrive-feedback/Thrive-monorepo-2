import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanes } from './settings-panes';

const pathname = vi.fn(() => '/settings');
vi.mock('next/navigation', () => ({ usePathname: () => pathname() }));

describe('SettingsPanes', () => {
  it('shows the open section beside the menu', () => {
    pathname.mockReturnValue('/settings/workspace');
    render(<SettingsPanes>the Workspace section</SettingsPanes>);

    expect(screen.getByText('the Workspace section')).toBeInTheDocument();
  });

  it('lists every section, for every Member', () => {
    render(<SettingsPanes>section</SettingsPanes>);

    // Named apart from the main sidebar's Settings menu, which sits on the same page.
    const menu = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(
      [...menu.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    ).toEqual([
      '/settings/account',
      '/settings/workspace',
      '/settings/workspace-goals',
      '/settings/teammates',
      '/settings/appearance',
    ]);
  });

  it("groups the Workspace's own sections under a Workspace heading, and Appearance under Other", () => {
    render(<SettingsPanes>section</SettingsPanes>);

    const menu = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(
      [...menu.querySelectorAll('li')].map((item) => item.textContent),
    ).toEqual([
      'Account',
      'Workspace',
      'General',
      'Goals',
      'Teammates',
      'Other',
      'Appearance',
    ]);
  });

  it('marks Account on the landing, since that is what it shows', () => {
    pathname.mockReturnValue('/settings');
    render(<SettingsPanes>section</SettingsPanes>);

    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('marks the open section, and only that one', () => {
    pathname.mockReturnValue('/settings/appearance');
    render(<SettingsPanes>section</SettingsPanes>);

    expect(screen.getByRole('link', { name: 'Appearance' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Account' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
