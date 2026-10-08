import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from './toaster';

describe('Toaster', () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('shows a toast raised from anywhere, with its title and description', async () => {
    render(<Toaster />);

    act(() => {
      toast.success('Resend success!', {
        description: 'We have sent the verification link.',
      });
    });

    expect(await screen.findByText('Resend success!')).toBeInTheDocument();
    expect(
      screen.getByText('We have sent the verification link.'),
    ).toBeInTheDocument();
  });

  it('closes a toast early from its close button', async () => {
    const user = userEvent.setup();
    render(<Toaster />);

    act(() => {
      toast.success('Invitations sent');
    });
    await screen.findByText('Invitations sent');

    await user.click(screen.getByRole('button', { name: 'Close toast' }));

    await vi.waitFor(() => {
      expect(screen.queryByText('Invitations sent')).not.toBeInTheDocument();
    });
  });

  it('paints a status toast on the opaque canvas, so what is behind it does not show through', async () => {
    render(<Toaster />);

    act(() => {
      toast.success('Signed in');
    });
    const shown = (await screen.findByText('Signed in')).closest('li');

    expect(shown).toHaveClass('bg-surface-base', 'from-status-success-surface');
    expect(shown).not.toHaveClass('bg-status-success-surface');
  });
});
