import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { preloadComposerForms } from '@/components/organisms/feedback-composer';
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

// The preview's composer opens on a form that loads apart from the page. Fetched first, as the
// page fetches it when idle, it draws at once rather than holding the preview mid-load.
beforeAll(() => preloadComposerForms());

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
    // What is waiting is no tab of its own on Home: it is always in view, above the tabs.
    expect(
      within(
        screen.getByRole('tabpanel', { name: 'Answer what you’re asked' }),
      ).getAllByRole('heading', { name: 'Waiting for me' }).length,
    ).toBeGreaterThan(0);
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
