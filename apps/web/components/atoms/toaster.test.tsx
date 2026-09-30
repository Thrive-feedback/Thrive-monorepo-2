import { act, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it } from 'vitest';
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
});
