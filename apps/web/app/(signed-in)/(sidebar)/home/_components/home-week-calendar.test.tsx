import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { weekEndingSunday } from '@/app/(signed-in)/(sidebar)/home/_lib/home-feed.fixture';
import { HomeDayJumpProvider } from './home-day-jump';
import { HomeWeekCalendar } from './home-week-calendar';
import { HomeWeekRibbon } from './home-week-ribbon';

/**
 * Tells the card whether the strip whose foot leaves as the composer sticks has scrolled up out of
 * the window, as the browser's observer would: all of it gone, or all of it back.
 */
let composerHasStuck: (stuck: boolean) => void;
/** Tells the card the strip is part way back: the page has scrolled up a little past the threshold. */
let stripIsPartWayBack: () => void;

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(
        callback: (
          entries: {
            isIntersecting: boolean;
            boundingClientRect: { top: number };
          }[],
        ) => void,
      ) {
        composerHasStuck = (stuck) =>
          callback([
            {
              isIntersecting: !stuck,
              boundingClientRect: { top: stuck ? -80 : 120 },
            },
          ]);
        stripIsPartWayBack = () =>
          callback([
            { isIntersecting: true, boundingClientRect: { top: -30 } },
          ]);
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const WEEK = weekEndingSunday({
  '2026-11-19': { kudos: 2 },
  '2026-11-22': { offered: 1 },
});

/** Home's week as the page draws it: the ribbon in the band, and the small card by the composer. */
function Week() {
  return (
    <HomeDayJumpProvider>
      <HomeWeekRibbon week={WEEK} />
      <div id="stuck-mark" />
      <HomeWeekCalendar week={WEEK} stuckMarkId="stuck-mark" />
    </HomeDayJumpProvider>
  );
}

const card = () =>
  screen.getByRole('navigation', { name: 'Last 7 days', hidden: true });

describe('HomeWeekCalendar', () => {
  it('stays out of reach while the composer has not stuck, even as it comes up to stick', () => {
    render(<Week />);
    act(() => composerHasStuck(false));
    expect(card()).toHaveAttribute('inert');

    act(() => stripIsPartWayBack());
    expect(card()).toHaveAttribute('inert');
  });

  it('comes within reach once the composer has stuck, and goes again when it is back at rest', () => {
    render(<Week />);

    act(() => composerHasStuck(true));
    expect(card()).not.toHaveAttribute('inert');

    act(() => composerHasStuck(false));
    expect(card()).toHaveAttribute('inert');
  });

  it('stays within reach while the page scrolls a little back up, and goes once it is well back', () => {
    render(<Week />);

    act(() => composerHasStuck(true));
    act(() => stripIsPartWayBack());
    expect(card()).not.toHaveAttribute('inert');

    act(() => composerHasStuck(true));
    act(() => stripIsPartWayBack());
    act(() => composerHasStuck(false));
    expect(card()).toHaveAttribute('inert');
  });

  it('names each day in full, marks today, and marks a quiet day unavailable', () => {
    render(<Week />);
    act(() => composerHasStuck(true));

    expect(
      screen.getByRole('button', { name: 'Today, Sunday 22 Nov, 1 offered' }),
    ).toHaveAttribute('aria-current', 'date');
    expect(
      screen.getByRole('button', { name: 'Thursday 19 Nov, 2 Kudos' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Wednesday 18 Nov, nothing written' }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('says a day in full, and what it held, when pointed at', async () => {
    render(<Week />);
    act(() => composerHasStuck(true));

    await userEvent.hover(
      screen.getByRole('button', { name: 'Today, Sunday 22 Nov, 1 offered' }),
    );

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Today, Sunday 22 Nov · 1 offered',
    );
  });

  it('keeps a quiet day reachable, finds nothing when it is pressed, and says why', async () => {
    render(<Week />);
    act(() => composerHasStuck(true));
    const wednesday = screen.getByRole('button', {
      name: 'Wednesday 18 Nov, nothing written',
    });

    await userEvent.click(wednesday);

    expect(wednesday).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByText(/^Finding/)).not.toBeInTheDocument();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Nothing written on Wednesday',
    );
  });

  it('reaches a quiet day from the keyboard and says it held nothing', async () => {
    render(<Week />);
    act(() => composerHasStuck(true));
    const wednesday = screen.getByRole('button', {
      name: 'Wednesday 18 Nov, nothing written',
    });

    act(() => wednesday.focus());

    expect(wednesday).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Nothing written on Wednesday',
    );
  });

  it('asks for the day pressed, as the ribbon does, and says it is finding it', async () => {
    render(<Week />);
    act(() => composerHasStuck(true));
    const thursday = screen.getByRole('button', {
      name: 'Thursday 19 Nov, 2 Kudos',
    });

    await userEvent.click(thursday);

    expect(thursday).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Finding Thursday…')).toBeInTheDocument();
  });

  it('is titled with the month its days fall in', () => {
    render(<Week />);

    expect(card()).toHaveTextContent(/^Last 7 daysNov/);
  });
});
