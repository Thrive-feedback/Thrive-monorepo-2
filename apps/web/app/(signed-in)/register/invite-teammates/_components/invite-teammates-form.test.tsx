import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import { InviteTeammatesForm } from './invite-teammates-form';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

function emailField(position: number) {
  return screen.getByRole('textbox', { name: `Email address ${position}` });
}

function emailFields() {
  return screen.getAllByRole('textbox', { name: /^Email address \d+$/ });
}

function button(name: string) {
  return screen.getByRole('button', { name });
}

describe('InviteTeammatesForm', () => {
  beforeEach(() => {
    push.mockClear();
  });

  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('opens with one empty Email address field', () => {
    render(<InviteTeammatesForm />);

    expect(emailFields()).toHaveLength(1);
    expect(emailField(1)).toHaveValue('');
  });

  it('adds one more field with Add another, and focuses it', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    await user.click(button('Add another'));

    expect(emailFields()).toHaveLength(2);
    expect(emailField(2)).toHaveFocus();
  });

  it('removes any field, moving focus to the one that takes its place', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Add another'));
    await user.type(emailField(2), 'happy@stark.com');

    await user.click(button('Remove email address 1'));

    expect(emailFields()).toHaveLength(1);
    expect(emailField(1)).toHaveValue('happy@stark.com');
    expect(emailField(1)).toHaveFocus();
  });

  it('keeps the last field', () => {
    render(<InviteTeammatesForm />);

    expect(
      screen.queryByRole('button', { name: /^Remove/ }),
    ).not.toBeInTheDocument();
  });

  it('flags a malformed address under its field, sends nothing and focuses it', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Add another'));
    await user.type(emailField(2), 'happy');

    await user.click(button('Send invites & Done'));

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');
    expect(emailField(2)).toHaveAttribute('aria-invalid', 'true');
    expect(emailField(2)).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(emailField(2)).toHaveFocus();
    expect(push).not.toHaveBeenCalled();
  });

  it('flags a personal Gmail address, which could never sign in', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'tony@gmail.com');

    await user.click(button('Send invites & Done'));

    expect(emailField(1)).toHaveAccessibleDescription(
      'Use a company email. Personal Gmail can’t sign in to Thrive.',
    );
  });

  it('checks the format as soon as the field is left', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'happy');

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');

    await user.tab();

    expect(emailField(1)).toHaveAttribute('aria-invalid', 'true');
    expect(emailField(1)).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
  });

  it('does not flag an empty field when it is left', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    await user.click(emailField(1));
    await user.tab();

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');
  });

  it('clears a field’s flag once it is edited', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'happy');
    await user.click(button('Send invites & Done'));

    await user.type(emailField(1), '@stark.com');

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');
  });

  it('disables Send invites & Done until a field holds an address', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    expect(button('Send invites & Done')).toBeDisabled();

    await user.type(emailField(1), '   ');
    expect(button('Send invites & Done')).toBeDisabled();

    await user.type(emailField(1), 'pepper@stark.com');
    expect(button('Send invites & Done')).toBeEnabled();

    await user.clear(emailField(1));
    expect(button('Send invites & Done')).toBeDisabled();
  });

  it('toasts how many were invited and goes Home, ignoring empty fields and merging duplicates', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster />
        <InviteTeammatesForm />
      </>,
    );
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Add another'));
    await user.click(button('Add another'));
    await user.type(emailField(3), 'PEPPER@stark.com');
    await user.click(button('Add another'));
    await user.type(emailField(4), 'happy@stark.com');

    await user.click(button('Send invites & Done'));

    expect(await screen.findByText('Invitations sent')).toBeInTheDocument();
    expect(screen.getByText('We invited 2 teammates.')).toBeInTheDocument();
    expect(screen.queryByText(/@stark\.com/)).not.toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/home');
  });

  it('goes Home on Skip & Done', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    await user.click(button('Skip & Done'));

    expect(push).toHaveBeenCalledWith('/home');
  });
});
