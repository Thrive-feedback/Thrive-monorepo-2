import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextLink from 'next/link';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import {
  SidebarDrawer,
  SidebarDrawerContent,
  SidebarDrawerTrigger,
} from './sidebar-drawer';

const usePathname = vi.fn((): string => ROUTES.home);
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

/** A window whose width the test sets, telling whoever listens when it crosses a breakpoint. */
function aWindow() {
  let wide = false;
  const listeners = new Set<() => void>();
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return wide;
        },
        media: query,
        onchange: null,
        addEventListener: (
          _type: string,
          listener: EventListenerOrEventListenerObject,
        ) => {
          listeners.add(() => {
            if (typeof listener === 'function') {
              listener(new Event('change'));
            }
          });
        },
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) satisfies MediaQueryList,
  );
  return {
    /** Widens it to `md` and up, or narrows it below. */
    setWide(isWide: boolean) {
      wide = isWide;
      act(() => {
        for (const listener of listeners) {
          listener();
        }
      });
    },
  };
}

function Menu() {
  return (
    <SidebarDrawer>
      <SidebarDrawerTrigger />
      <SidebarDrawerContent>
        <nav aria-label="Main">
          <NextLink href={ROUTES.home}>Home</NextLink>
          <NextLink href={ROUTES.received}>Received</NextLink>
        </nav>
      </SidebarDrawerContent>
    </SidebarDrawer>
  );
}

async function openMenu() {
  const user = userEvent.setup();
  const { rerender } = render(<Menu />);
  await user.click(screen.getByRole('button', { name: 'Open menu' }));
  return { user, rerender };
}

let browserWindow: ReturnType<typeof aWindow>;

beforeEach(() => {
  usePathname.mockReturnValue(ROUTES.home);
  browserWindow = aWindow();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SidebarDrawer', () => {
  it('opens from the menu button as a drawer named Menu, along the left edge, holding where to go', async () => {
    await openMenu();

    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    expect(drawer).toHaveAttribute('data-swipe-direction', 'left');
    expect(
      within(drawer).getByRole('link', { name: 'Received' }),
    ).toBeInTheDocument();
  });

  it('puts itself away once the person has gone to another page', async () => {
    const { rerender } = await openMenu();

    // The layout stays mounted across a client navigation; only the path it reads changes.
    usePathname.mockReturnValue(ROUTES.received);
    rerender(<Menu />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts itself away when the link to the page already open is pressed', async () => {
    const { user } = await openMenu();

    await user.click(
      within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('link', {
        name: 'Home',
      }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts itself away when the window reaches md, and stays away when it narrows again', async () => {
    await openMenu();

    browserWindow.setWide(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    browserWindow.setWide(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
