import { act, render, screen, waitFor, within } from '@testing-library/react';
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
  aWindow(false);
  marks = watchMarks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const WEEK = weekEndingSunday({
  '2026-11-19': { kudos: 2 },
  '2026-11-22': { offered: 1 },
});

/** Home's week on a phone: the ribbon in the band, the strip under the heading, and the list's days. */
function PhoneWeek() {
  return (
    <HomeDayJumpProvider>
      <HomeWeekRibbon week={WEEK} />
      <div id="strip-mark" />
      <HomeWeekStrip week={WEEK} shownMarkId="strip-mark" />
      {LISTED_DAYS.map((day) => (
        <section key={day} id={dayAnchorOf(day)} />
      ))}
    </HomeDayJumpProvider>
  );
}

const card = () =>
  screen.getByRole('navigation', { name: 'Last 7 days', hidden: true });

describe('HomeWeekStrip', () => {
  it('stays out of reach until the composer has scrolled away, and goes again when it is back', () => {
    render(<PhoneWeek />);
    expect(card()).toHaveAttribute('inert');

    act(() => marks.hasStuck(true));
    expect(card()).not.toHaveAttribute('inert');

    act(() => marks.hasStuck(false));
    expect(card()).toHaveAttribute('inert');
  });

  it('stays within reach while the page scrolls a little back up', () => {
    render(<PhoneWeek />);

    act(() => marks.hasStuck(true));
    act(() => marks.isPartWayBack());

    expect(card()).not.toHaveAttribute('inert');
  });

  it('is named for a screen reader, though it shows only its days', () => {
    render(<PhoneWeek />);
    act(() => marks.hasStuck(true));

    expect(card()).toHaveAccessibleName('Last 7 days');
  });

  it('shows the day the list has scrolled to', async () => {
    render(<PhoneWeek />);
    act(() => marks.hasStuck(true));

    scrollListTo('2026-11-19');

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Thursday 19 Nov, 2 Kudos' }),
      ).toHaveAttribute('aria-current', 'location'),
    );
  });

  it('follows the scroll in the strip alone, never beside the composer too', async () => {
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
      expect(thursdayIn(strip)).toHaveAttribute('aria-current', 'location'),
    );
    expect(thursdayIn(beside)).not.toHaveAttribute('aria-current');
  });
});
