import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LandingTour } from './landing-tour';

// The preview's dialog asks for the router, which only matters when it closes to an address.
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

/*
 * Home draws a narrow layout and a wide one and CSS shows one, so jsdom sees both: every control
 * in the preview appears twice. These tests read the first, the narrow one.
 */
function first(role: string, name: string | RegExp) {
  const [element] = screen.getAllByRole(role, { name });
  if (!element) throw new Error(`No ${role} named ${name}`);
  return element;
}

describe('LandingTour', () => {
  it('opens on the Workspace, as Home does', () => {
    render(<LandingTour />);

    expect(
      screen.getByRole('tab', { name: 'See what the team shares' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('tab', { name: 'Answer what you’re asked' }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('opens the tab a chapter shows', () => {
    render(<LandingTour />);

    // Selected by focus, as the keyboard selects it: jsdom lays everything out at zero size, so
    // the preview's resize handle sits under every pointer and takes the press a tab listens for.
    act(() =>
      screen.getByRole('tab', { name: 'Answer what you’re asked' }).focus(),
    );

    expect(
      screen.getByRole('tab', { name: 'Answer what you’re asked' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(first('button', 'Waiting for me')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('tabpanel', { name: 'Answer what you’re asked' }),
    ).toBeInTheDocument();
  });

  it('lights the chapter of a tab opened inside the preview', async () => {
    const user = userEvent.setup();
    render(<LandingTour />);

    await user.click(first('button', 'Feedback for me'));

    expect(
      screen.getByRole('tab', { name: 'Read what’s written to you' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('tab', { name: 'See what the team shares' }),
    ).toHaveAttribute('aria-selected', 'false');
  });
});
