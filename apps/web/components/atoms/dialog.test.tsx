import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

function InviteDialog({
  placement,
  hasCloseButton,
  overlayClassName,
}: {
  placement?: 'adaptive' | 'screen';
  hasCloseButton?: boolean;
  overlayClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger>Invite</DialogTrigger>
      <DialogContent
        placement={placement}
        hasCloseButton={hasCloseButton}
        overlayClassName={overlayClassName}
      >
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>They get an email with a link.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Opened and closed by its caller, as most dialogs in the app are. */
function ControlledInviteDialog({
  onOpenChange,
}: {
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogTitle>Invite a teammate</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}

/** The sheet's grab handle, which is hidden from assistive technology and found as the page draws it. */
function sheetHandle() {
  return document.querySelector<HTMLElement>('[data-slot="dialog-handle"]');
}

/** jsdom lays nothing out, so the sheet is given the height a phone would. */
const SHEET_HEIGHT = 800;

/** Opens the uncontrolled dialog with a sheet `SHEET_HEIGHT` tall, its event clock at 0. */
async function openTallSheet() {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(
    SHEET_HEIGHT,
  );
  const user = userEvent.setup();
  render(<InviteDialog />);
  await user.click(screen.getByRole('button', { name: 'Invite' }));
  const handle = sheetHandle();
  if (!handle) {
    throw new Error('The sheet has no handle.');
  }
  // Only the clock events are stamped with, so the timing of a drag is the test's to set.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(0);
  return { user, handle };
}

/** Moves the held handle to `clientY` at `time`, in milliseconds. */
async function dragTo(
  user: ReturnType<typeof userEvent.setup>,
  handle: HTMLElement,
  clientY: number,
  time: number,
) {
  vi.setSystemTime(time);
  await user.pointer({ target: handle, coords: { clientY } });
}

describe('Dialog', () => {
  it('opens from its trigger as a dialog named and described by its header', async () => {
    const user = userEvent.setup();
    render(<InviteDialog />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    const dialog = screen.getByRole('dialog', { name: 'Invite a teammate' });
    expect(dialog).toHaveAccessibleDescription(
      'They get an email with a link.',
    );
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<InviteDialog />);
    const trigger = screen.getByRole('button', { name: 'Invite' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes from the corner button and from a control wrapped in DialogClose', async () => {
    const user = userEvent.setup();
    render(<InviteDialog />);

    await user.click(screen.getByRole('button', { name: 'Invite' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Invite' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('adds a class to the scrim behind it when asked', async () => {
    const user = userEvent.setup();
    render(<InviteDialog overlayClassName="less-blur" />);

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      'less-blur',
    );
  });

  it('leaves the corner button out when asked', async () => {
    const user = userEvent.setup();
    render(<InviteDialog hasCloseButton={false} />);

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
  });

  it('closes when its handle is dragged down, and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<InviteDialog />);
    const trigger = screen.getByRole('button', { name: 'Invite' });
    await user.click(trigger);
    const handle = sheetHandle();
    if (!handle) {
      throw new Error('The sheet has no handle.');
    }

    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { clientY: 0 } },
      { target: handle, coords: { clientY: 240 } },
      { keys: '[/MouseLeft]', target: handle, coords: { clientY: 240 } },
    ]);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('stays open when its handle is pressed and let go without a drag', async () => {
    const user = userEvent.setup();
    render(<InviteDialog />);
    await user.click(screen.getByRole('button', { name: 'Invite' }));
    const handle = sheetHandle();
    if (!handle) {
      throw new Error('The sheet has no handle.');
    }

    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { clientY: 0 } },
      { keys: '[/MouseLeft]', target: handle, coords: { clientY: 0 } },
    ]);

    expect(
      screen.getByRole('dialog', { name: 'Invite a teammate' }),
    ).toBeInTheDocument();
  });

  it('tells its caller it closed when a swipe closes it', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    render(<ControlledInviteDialog onOpenChange={handleOpenChange} />);
    const handle = sheetHandle();
    if (!handle) {
      throw new Error('The sheet has no handle.');
    }

    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { clientY: 0 } },
      { target: handle, coords: { clientY: 240 } },
      { keys: '[/MouseLeft]', target: handle, coords: { clientY: 240 } },
    ]);

    expect(handleOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no handle when its caller lays it out over the whole window', async () => {
    const user = userEvent.setup();
    render(<InviteDialog placement="screen" />);

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(sheetHandle()).not.toBeInTheDocument();
  });

  describe('swiped by its handle', () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('springs back from a slow drag short of a quarter of its height', async () => {
      const { user, handle } = await openTallSheet();

      await user.pointer({
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientY: 0 },
      });
      await dragTo(user, handle, 100, 1000);
      vi.setSystemTime(1010);
      await user.pointer({ keys: '[/MouseLeft]', target: handle });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes from a slow drag past a quarter of its height', async () => {
      const { user, handle } = await openTallSheet();

      await user.pointer({
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientY: 0 },
      });
      await dragTo(user, handle, SHEET_HEIGHT / 4 + 40, 1000);
      vi.setSystemTime(1010);
      await user.pointer({ keys: '[/MouseLeft]', target: handle });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes from a short flick let go while still moving', async () => {
      const { user, handle } = await openTallSheet();

      await user.pointer({
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientY: 0 },
      });
      await dragTo(user, handle, 60, 10);
      vi.setSystemTime(20);
      await user.pointer({ keys: '[/MouseLeft]', target: handle });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('springs back from a short flick held still before it is let go', async () => {
      const { user, handle } = await openTallSheet();

      await user.pointer({
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientY: 0 },
      });
      await dragTo(user, handle, 60, 10);
      vi.setSystemTime(500);
      await user.pointer({ keys: '[/MouseLeft]', target: handle });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('never moves up, so a drag upward leaves it open', async () => {
      const { user, handle } = await openTallSheet();

      await user.pointer({
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientY: 400 },
      });
      await dragTo(user, handle, 0, 10);
      vi.setSystemTime(20);
      await user.pointer({ keys: '[/MouseLeft]', target: handle });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('stays open when the browser cancels a long drag', async () => {
      const { user, handle } = await openTallSheet();

      await user.pointer({
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientY: 0 },
      });
      await dragTo(user, handle, SHEET_HEIGHT / 2, 1000);
      fireEvent.pointerCancel(handle);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
