import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OneOnOneScheduleChoice } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { ScheduleFields } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/schedule-fields';

const WEEKLY: OneOnOneScheduleChoice = {
  cadence: 'WEEKLY',
  weekday: 4,
};

describe('ScheduleFields', () => {
  it('asks only how often and on which day: no time, no length, no template', () => {
    render(<ScheduleFields value={WEEKLY} onChange={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Day' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^Time/ })).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: 'Length' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Agenda starts from' }),
    ).not.toBeInTheDocument();
  });
});
