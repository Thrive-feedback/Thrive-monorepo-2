import { render, screen } from '@testing-library/react';
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
    expect(drawer.contains(document.activeElement)).toBe(true);
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
  function StampsDrawer({ onPageClick }: { onPageClick: () => void }) {
    return (
      <>
        <button type="button" onClick={onPageClick}>
          On the page
        </button>
        <Drawer modal={false}>
          <DrawerTrigger>Stamps</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Stamps</DrawerTitle>
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
    render(<StampsDrawer onPageClick={onPageClick} />);

    await user.click(screen.getByRole('button', { name: 'Stamps' }));
    expect(
      screen.getByRole('button', { name: 'On the page' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'On the page' }));

    expect(onPageClick).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('still closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<StampsDrawer onPageClick={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Stamps' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
