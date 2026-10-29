import { render, screen } from '@testing-library/react';
import { HashIcon, HouseIcon, PaletteIcon, UsersIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { SideNav } from './side-nav';

const ITEMS = [
  { href: '/a', label: 'First', Icon: HouseIcon },
  { href: '/b', label: 'Second', Icon: PaletteIcon },
];

const TREE = [
  { href: '/a', label: 'First', Icon: HouseIcon },
  {
    href: '/w',
    label: 'Workspace',
    Icon: PaletteIcon,
    children: [
      { href: '/w/goals', label: 'Goals', Icon: HashIcon },
      { href: '/w/members', label: 'Members', Icon: UsersIcon },
    ],
  },
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

  it('lists an item’s children under it, always shown, in order', () => {
    render(<SideNav label="Settings" items={TREE} currentHref="/w/goals" />);

    const menu = screen.getByRole('navigation', { name: 'Settings' });
    expect(
      [...menu.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    ).toEqual(['/a', '/w', '/w/goals', '/w/members']);
    expect(screen.getByRole('link', { name: 'Members' })).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: 'Goals' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('draws an item with nowhere to go yet as a button marked unavailable, in its place', () => {
    render(
      <SideNav
        label="Main"
        items={[...ITEMS, { label: 'Later', Icon: UsersIcon }]}
        currentHref="/a"
      />,
    );

    expect(screen.getByRole('button', { name: 'Later' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getAllByRole('listitem').at(-1)).toHaveTextContent('Later');
  });

  it('shows a count beside an item, and nothing at zero', () => {
    render(
      <SideNav
        label="Main"
        items={[
          { href: '/a', label: 'Waiting', Icon: HouseIcon, count: 3 },
          { href: '/b', label: 'Done', Icon: PaletteIcon, count: 0 },
        ]}
        currentHref="/a"
      />,
    );

    expect(screen.getByRole('link', { name: 'Waiting 3' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Done' })).toBeVisible();
  });

  it('labels the items that follow a heading', () => {
    render(
      <SideNav
        label="Main"
        items={[
          { href: '/a', label: 'First', Icon: HouseIcon },
          { heading: 'Mine' },
          { href: '/b', label: 'Second', Icon: PaletteIcon },
        ]}
        currentHref="/a"
      />,
    );

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['First', 'Mine', 'Second']);
  });
});
