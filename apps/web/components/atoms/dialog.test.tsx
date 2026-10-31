import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
  hasCloseButton,
  overlayClassName,
}: {
  hasCloseButton?: boolean;
  overlayClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger>Invite</DialogTrigger>
      <DialogContent
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
});
