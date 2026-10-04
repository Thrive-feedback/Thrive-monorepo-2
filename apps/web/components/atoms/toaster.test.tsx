import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/lib/test/render-with-intl';
import { Toaster } from './toaster';

describe('Toaster', () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('shows a toast raised from anywhere, with its title and description', async () => {
    renderWithIntl(<Toaster />);

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
    renderWithIntl(<Toaster />);

    act(() => {
      toast.success('Invitations sent');
    });
    await screen.findByText('Invitations sent');

    await user.click(
      screen.getByRole('button', { name: 'Close notification' }),
    );

    await vi.waitFor(() => {
      expect(screen.queryByText('Invitations sent')).not.toBeInTheDocument();
    });
  });
});
