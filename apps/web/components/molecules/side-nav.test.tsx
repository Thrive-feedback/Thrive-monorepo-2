import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashIcon, HouseIcon, PaletteIcon, UsersIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { SideNav } from './side-nav';

/** Longer than the tooltip's 300ms hover delay. */
const TOOLTIP_DELAY_PASSED = 400;

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

  // jsdom cannot apply a breakpoint, so the classes that colour the open page stand in for it.
  it('colours the open page at every width, as a phone’s menu drawer shows it', () => {
    render(<SideNav label="Main" items={ITEMS} currentHref="/a" />);

    expect(screen.getByRole('link', { name: 'First' })).toHaveClass(
      'aria-[current]:bg-action-primary-surface',
    );
  });

  it('colours the open page only from md for a menu a phone shows alone', () => {
    render(
      <SideNav
        label="Settings"
        items={ITEMS}
        currentHref="/a"
        marksCurrentFromMd
      />,
    );

    const first = screen.getByRole('link', { name: 'First' });
    expect(first).toHaveClass('md:aria-[current]:bg-action-primary-surface');
    expect(first).not.toHaveClass('aria-[current]:bg-action-primary-surface');
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

    // Drawn as a number and said as words, as every count is.
    const waiting = screen.getByRole('link', { name: /^Waiting ?, 3 unread$/ });
    expect(waiting).toBeVisible();
    expect(within(waiting).getByText('3')).toHaveClass('bg-attention');
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

  it('folded to its icons, keeps every item named, its count read, and names one pointed at', async () => {
    const user = userEvent.setup();
    render(
      <SideNav
        label="Main"
        items={[
          { href: '/a', label: 'Home', Icon: HouseIcon },
          { heading: 'Mine' },
          { href: '/b', label: 'Waiting', Icon: PaletteIcon, count: 2 },
        ]}
        currentHref="/a"
        foldsToIcons
      />,
    );

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: /^Waiting ?, 2 unread$/ }),
    ).toBeVisible();
    expect(screen.getByText('Mine')).toBeInTheDocument();

    await user.hover(
      screen.getByRole('link', { name: /^Waiting ?, 2 unread$/ }),
    );

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Waiting');
  });

  it('keeps a place not open yet in the menu, greyed with its note, and not a link', () => {
    render(
      <SideNav
        label="Main"
        items={[
          { href: '/a', label: 'Home', Icon: HouseIcon },
          {
            href: '/b',
            label: 'Later',
            Icon: PaletteIcon,
            unavailableNote: 'Coming soon',
          },
        ]}
        currentHref="/b"
      />,
    );

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['Home', 'LaterComing soon']);
    expect(screen.queryByRole('link', { name: /Later/ })).toBeNull();
  });

  it('folded to its icons, names a place not open yet with its note when pointed at', async () => {
    const user = userEvent.setup();
    render(
      <SideNav
        label="Main"
        items={[
          {
            href: '/b',
            label: 'Later',
            Icon: PaletteIcon,
            unavailableNote: 'Coming soon',
          },
        ]}
        foldsToIcons
      />,
    );

    await user.hover(screen.getByText('Later'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Later · Coming soon',
    );
  });

  it('names no item by tooltip when it is not folded, since the labels show', async () => {
    const user = userEvent.setup();
    render(<SideNav label="Main" items={ITEMS} currentHref="/a" />);

    await user.hover(screen.getByRole('link', { name: 'Second' }));
    // Past the tooltip's 300ms delay, so one that would open has had its chance.
    await new Promise((resolve) => setTimeout(resolve, TOOLTIP_DELAY_PASSED));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
