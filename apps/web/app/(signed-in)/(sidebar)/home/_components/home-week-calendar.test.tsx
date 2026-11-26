import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { weekEndingSunday } from '@/app/(signed-in)/(sidebar)/home/_lib/home-feed.fixture';
import {
  aWindow,
  LISTED_DAYS,
  scrollListTo,
  watchMarks,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-scroll.fixture';
import { HomeDayJumpProvider } from './home-day-jump';
import { dayAnchorOf } from './home-feed-day';
import { HomeWeekCalendar } from './home-week-calendar';
import { HomeWeekRibbon } from './home-week-ribbon';
import { HomeWeekStrip } from './home-week-strip';

let marks: ReturnType<typeof watchMarks>;

beforeEach(() => {
  aWindow(true);
  marks = watchMarks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const WEEK = weekEndingSunday({
  '2026-11-19': { kudos: 2 },
  '2026-11-22': { offered: 1 },
});

/**
 * Home's week as the page draws it: the ribbon in the band, the small card by the composer, and the
 * list's days below.
 */
function Week() {
  return (
    <HomeDayJumpProvider>
      <HomeWeekRibbon week={WEEK} />
      <div id="stuck-mark" />
      <HomeWeekCalendar week={WEEK} stuckMarkId="stuck-mark" />
      {LISTED_DAYS.map((day) => (
        <section key={day} id={dayAnchorOf(day)} />
      ))}
    </HomeDayJumpProvider>
  );
}

const card = () =>
  screen.getByRole('navigation', { name: 'Last 7 days', hidden: true });

describe('HomeWeekCalendar', () => {
  it('stays out of reach while the composer has not stuck, even as it comes up to stick', () => {
    render(<Week />);
    act(() => marks.hasStuck(false));
    expect(card()).toHaveAttribute('inert');

    act(() => marks.isPartWayBack());
    expect(card()).toHaveAttribute('inert');
  });

  it('comes within reach once the composer has stuck, and goes again when it is back at rest', () => {
    render(<Week />);

    act(() => marks.hasStuck(true));
    expect(card()).not.toHaveAttribute('inert');

    act(() => marks.hasStuck(false));
    expect(card()).toHaveAttribute('inert');
  });

  it('stays within reach while the page scrolls a little back up, and goes once it is well back', () => {
    render(<Week />);

    act(() => marks.hasStuck(true));
    act(() => marks.isPartWayBack());
    expect(card()).not.toHaveAttribute('inert');

    act(() => marks.hasStuck(true));
    act(() => marks.isPartWayBack());
    act(() => marks.hasStuck(false));
    expect(card()).toHaveAttribute('inert');
  });

  it('names each day in full, marks today, and marks a quiet day unavailable', () => {
    render(<Week />);
    act(() => marks.hasStuck(true));

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
    act(() => marks.hasStuck(true));

    await userEvent.hover(
      screen.getByRole('button', { name: 'Today, Sunday 22 Nov, 1 offered' }),
    );

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Today, Sunday 22 Nov · 1 offered',
    );
  });

  it('keeps a quiet day reachable, finds nothing when it is pressed, and says why', async () => {
    render(<Week />);
    act(() => marks.hasStuck(true));
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
    act(() => marks.hasStuck(true));
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
    act(() => marks.hasStuck(true));
    const thursday = screen.getByRole('button', {
      name: 'Thursday 19 Nov, 2 Kudos',
    });

    await userEvent.click(thursday);

    expect(thursday).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Finding Thursday…')).toBeInTheDocument();
  });

  it('shows the day the list has scrolled to, and follows the scroll', async () => {
    render(<Week />);
    act(() => marks.hasStuck(true));
    const thursday = screen.getByRole('button', {
      name: 'Thursday 19 Nov, 2 Kudos',
    });
    const wednesday = screen.getByRole('button', {
      name: 'Wednesday 18 Nov, nothing written',
    });

    scrollListTo('2026-11-19');
    await waitFor(() =>
      expect(thursday).toHaveAttribute('aria-current', 'location'),
    );

    scrollListTo('2026-11-18');
    await waitFor(() =>
      expect(wednesday).toHaveAttribute('aria-current', 'location'),
    );
    expect(thursday).not.toHaveAttribute('aria-current');
  });

  it('shows no day once the list has scrolled past the week', async () => {
    render(<Week />);
    act(() => marks.hasStuck(true));
    scrollListTo('2026-11-16');
    const monday = screen.getByRole('button', {
      name: 'Monday 16 Nov, nothing written',
    });
    await waitFor(() =>
      expect(monday).toHaveAttribute('aria-current', 'location'),
    );

    scrollListTo('2026-11-15');

    await waitFor(() => expect(monday).not.toHaveAttribute('aria-current'));
    expect(
      screen.getByRole('button', { name: 'Today, Sunday 22 Nov, 1 offered' }),
    ).toHaveAttribute('aria-current', 'date');
  });

  it('says where the reader is rather than which day is today, when today is the day scrolled to', async () => {
    render(<Week />);
    act(() => marks.hasStuck(true));
    const today = screen.getByRole('button', {
      name: 'Today, Sunday 22 Nov, 1 offered',
    });

    scrollListTo('2026-11-22');
    await waitFor(() =>
      expect(today).toHaveAttribute('aria-current', 'location'),
    );

    scrollListTo('2026-11-19');
    await waitFor(() => expect(today).toHaveAttribute('aria-current', 'date'));
  });

  it('lets go of the day scrolled to while the composer is at rest, and finds it again once it sticks', async () => {
    render(<Week />);
    act(() => marks.hasStuck(true));
    const thursday = screen.getByRole('button', {
      name: 'Thursday 19 Nov, 2 Kudos',
      hidden: true,
    });
    scrollListTo('2026-11-19');
    await waitFor(() =>
      expect(thursday).toHaveAttribute('aria-current', 'location'),
    );

    act(() => marks.hasStuck(false));
    expect(thursday).not.toHaveAttribute('aria-current');

    act(() => marks.hasStuck(true));
    expect(thursday).toHaveAttribute('aria-current', 'location');
  });

  it('follows the scroll beside the composer alone, never in the phone strip too', async () => {
    render(
      <HomeDayJumpProvider>
        <div id="stuck-mark" />
        <HomeWeekCalendar week={WEEK} stuckMarkId="stuck-mark" />
        <div id="strip-mark" />
        <HomeWeekStrip week={WEEK} shownMarkId="strip-mark" />
        {LISTED_DAYS.map((day) => (
          <section key={day} id={dayAnchorOf(day)} />
        ))}
      </HomeDayJumpProvider>,
    );
    act(() => marks.hasStuck(true));
    const weeks = screen.getAllByRole('navigation', {
      name: 'Last 7 days',
      hidden: true,
    });
    expect(weeks).toHaveLength(2);
    const [beside, strip] = weeks;
    const thursdayIn = (week: HTMLElement | undefined) => {
      if (!week) {
        throw new Error('Both weeks are drawn.');
      }
      return within(week).getByRole('button', {
        name: 'Thursday 19 Nov, 2 Kudos',
        hidden: true,
      });
    };

    scrollListTo('2026-11-19');

    await waitFor(() =>
      expect(thursdayIn(beside)).toHaveAttribute('aria-current', 'location'),
    );
    expect(thursdayIn(strip)).not.toHaveAttribute('aria-current');
  });

  it('is titled with the month its days fall in', () => {
    render(<Week />);

    expect(card()).toHaveTextContent(/^Last 7 daysNov/);
  });
});
