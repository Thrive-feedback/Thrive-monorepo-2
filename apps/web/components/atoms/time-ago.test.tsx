import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeAgo } from './time-ago';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-31T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TimeAgo', () => {
  it('says how long ago, and keeps the day on a hover', () => {
    render(<TimeAgo dateTime="2026-10-31T09:00:00.000Z" />);

    const time = screen.getByText('3 hours ago');
    expect(time).toHaveAttribute('dateTime', '2026-10-31T09:00:00.000Z');
    expect(time).toHaveAttribute('title', '31 Oct 2026');
  });

  it('says just now for what only just happened', () => {
    render(<TimeAgo dateTime="2026-10-31T11:59:40.000Z" />);

    expect(screen.getByText('just now')).toBeVisible();
  });
});
