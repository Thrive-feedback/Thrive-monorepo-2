import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

function TemplatesDrawer() {
  return (
    <Drawer>
      <DrawerTrigger>Templates</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Templates</DrawerTitle>
          <DrawerDescription>
            Choose the picture on the front.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerClose>Done</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

describe('Drawer', () => {
  it('opens from its trigger as a dialog named and described by its header', async () => {
    const user = userEvent.setup();
    render(<TemplatesDrawer />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Templates' }));

    const drawer = screen.getByRole('dialog', { name: 'Templates' });
    expect(drawer).toHaveAccessibleDescription(
      'Choose the picture on the front.',
    );
    // The drawer moves focus into itself a frame after it opens.
    await waitFor(() =>
      expect(drawer.contains(document.activeElement)).toBe(true),
    );
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<TemplatesDrawer />);
    const trigger = screen.getByRole('button', { name: 'Templates' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes from the corner button and from a control wrapped in DrawerClose', async () => {
    const user = userEvent.setup();
    render(<TemplatesDrawer />);

    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Drawer, not modal', () => {
  function StickersDrawer({ onPageClick }: { onPageClick: () => void }) {
    return (
      <>
        <button type="button" onClick={onPageClick}>
          On the page
        </button>
        <Drawer modal={false}>
          <DrawerTrigger>Stickers</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Stickers</DrawerTitle>
              <DrawerDescription>Add one to your card.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  it('leaves the page in reach, and a press there both closes it and reaches the page', async () => {
    const user = userEvent.setup();
    const onPageClick = vi.fn();
    render(<StickersDrawer onPageClick={onPageClick} />);

    await user.click(screen.getByRole('button', { name: 'Stickers' }));
    expect(
      screen.getByRole('button', { name: 'On the page' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'On the page' }));

    expect(onPageClick).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('still closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<StickersDrawer onPageClick={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Stickers' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('Drawer, by width', () => {
  function asWideAs(isWide: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: isWide,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) satisfies MediaQueryList,
    );
  }

  // jsdom lays nothing out, so where the drawer sits is read from the edge Base UI was told and
  // the handle's presence, standing in for a position no test here can see.
  it('is a sheet from the bottom on a phone, with a handle that says it swipes down', async () => {
    const user = userEvent.setup();
    asWideAs(false);
    render(<TemplatesDrawer />);

    await user.click(screen.getByRole('button', { name: 'Templates' }));

    const drawer = screen.getByRole('dialog', { name: 'Templates' });
    expect(drawer).toHaveAttribute('data-swipe-direction', 'down');
    expect(drawer.querySelector('[data-slot="drawer-handle"]')).not.toBeNull();
  });

  it('is a panel from the right from md, without a handle', async () => {
    const user = userEvent.setup();
    asWideAs(true);
    render(<TemplatesDrawer />);

    await user.click(screen.getByRole('button', { name: 'Templates' }));

    const drawer = screen.getByRole('dialog', { name: 'Templates' });
    expect(drawer).toHaveAttribute('data-swipe-direction', 'right');
    expect(drawer.querySelector('[data-slot="drawer-handle"]')).toBeNull();
  });
});

describe('Drawer, not modal, pressed', () => {
  function StickersDrawer() {
    return (
      <>
        <p>On the page</p>
        <Drawer modal={false}>
          <DrawerTrigger>Stickers</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Stickers</DrawerTitle>
              <DrawerDescription>Add one to your card.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  it('closes as a mouse press on the page goes down, not when it is let go', async () => {
    const user = userEvent.setup();
    render(<StickersDrawer />);

    await user.click(screen.getByRole('button', { name: 'Stickers' }));
    await user.pointer({
      keys: '[MouseLeft>]',
      target: screen.getByText('On the page'),
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.pointer({ keys: '[/MouseLeft]' });
  });

  it('stays open the moment a finger lands on the page, leaving touch to Base UI', async () => {
    const user = userEvent.setup();
    render(<StickersDrawer />);

    await user.click(screen.getByRole('button', { name: 'Stickers' }));
    await user.pointer({
      keys: '[TouchA>]',
      target: screen.getByText('On the page'),
    });

    expect(
      screen.getByRole('dialog', { name: 'Stickers' }),
    ).toBeInTheDocument();
    await user.pointer({ keys: '[/TouchA]' });
  });

  it('closes on a press of its own trigger, rather than opening again', async () => {
    const user = userEvent.setup();
    render(<StickersDrawer />);
    const trigger = screen.getByRole('button', { name: 'Stickers' });

    await user.click(trigger);
    expect(
      screen.getByRole('dialog', { name: 'Stickers' }),
    ).toBeInTheDocument();
    await user.click(trigger);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
