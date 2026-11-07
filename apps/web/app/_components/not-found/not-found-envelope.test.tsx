import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundEnvelope } from './not-found-envelope';

const push = vi.fn();
const back = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/settings/teamates-old',
  useRouter: () => ({ push, back }),
}));

const DESTINATIONS = [
  { href: '/home', label: 'Take me Home' },
  { href: '/received', label: 'Received' },
] as const;

/** Whether the page asks for less motion, as the person's system says. */
function prefersLessMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce });
}

beforeEach(() => {
  push.mockReset();
  back.mockReset();
  prefersLessMotion(false);
});

describe('NotFoundEnvelope', () => {
  it('addresses the letter to the path that was asked for', () => {
    render(<NotFoundEnvelope destinations={DESTINATIONS} />);

    expect(
      screen.getByRole('figure', {
        name: 'A letter to /settings/teamates-old, which could not be delivered',
      }),
    ).toHaveTextContent('/settings/teamates-old');
  });

  it('offers every destination as a real link, the first as the main one', () => {
    render(<NotFoundEnvelope destinations={DESTINATIONS} />);

    const places = screen.getByRole('navigation', {
      name: 'Somewhere real instead',
    });
    expect(screen.getByRole('link', { name: 'Take me Home' })).toHaveAttribute(
      'href',
      '/home',
    );
    expect(screen.getByRole('link', { name: 'Received' })).toHaveAttribute(
      'href',
      '/received',
    );
    expect(places).toContainElement(
      screen.getByRole('button', { name: 'Go back' }),
    );
  });

  it('writes the new address on the envelope and says where it is sending them', async () => {
    const user = userEvent.setup();
    render(<NotFoundEnvelope destinations={DESTINATIONS} />);

    await user.click(screen.getByRole('link', { name: 'Received' }));

    expect(screen.getByRole('figure')).toHaveTextContent('Received');
    expect(screen.getByText('Sending you to Received.')).toBeInTheDocument();
  });

  it('goes back when asked', async () => {
    const user = userEvent.setup();
    render(<NotFoundEnvelope destinations={DESTINATIONS} />);

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(back).toHaveBeenCalled();
  });

  it('skips the flight for someone who asks for less motion, leaving the link to go straight there', async () => {
    prefersLessMotion(true);
    const user = userEvent.setup();
    render(<NotFoundEnvelope destinations={DESTINATIONS} />);

    await user.click(screen.getByRole('link', { name: 'Received' }));

    expect(screen.queryByText('Sending you to Received.')).toBeNull();
  });
});
