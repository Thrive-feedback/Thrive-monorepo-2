import { render, screen } from '@testing-library/react';
import { HouseIcon, PaletteIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { SideNav } from './side-nav';

const ITEMS = [
  { href: '/a', label: 'First', Icon: HouseIcon },
  { href: '/b', label: 'Second', Icon: PaletteIcon },
];

describe('SideNav', () => {
  it('names the menu and lists every item in order', () => {
    render(<SideNav label="Settings" items={ITEMS} currentHref="/a" />);

    const menu = screen.getByRole('navigation', { name: 'Settings' });
    expect(
      [...menu.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    ).toEqual(['/a', '/b']);
  });

  it('marks only the current item', () => {
    render(<SideNav label="Settings" items={ITEMS} currentHref="/b" />);

    expect(screen.getByRole('link', { name: 'Second' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'First' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
