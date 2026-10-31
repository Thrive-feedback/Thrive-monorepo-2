import { describe, expect, it } from 'vitest';
import { postmarkDay } from './calendar-day.util';

describe('postmarkDay', () => {
  it('gives the day and month, then the year', () => {
    expect(postmarkDay('2026-10-04T09:30:00.000Z')).toEqual({
      dayAndMonth: '04 OCT',
      year: '2026',
    });
  });

  it.each([
    ['01', 'JAN'],
    ['02', 'FEB'],
    ['03', 'MAR'],
    ['04', 'APR'],
    ['05', 'MAY'],
    ['06', 'JUN'],
    ['07', 'JUL'],
    ['08', 'AUG'],
    ['09', 'SEP'],
    ['10', 'OCT'],
    ['11', 'NOV'],
    ['12', 'DEC'],
  ])('names month %s in three letters', (month, name) => {
    expect(postmarkDay(`2026-${month}-15T09:30:00.000Z`).dayAndMonth).toBe(
      `15 ${name}`,
    );
  });

  it('keeps to the UTC day, whatever the time', () => {
    expect(postmarkDay('2026-10-04T23:59:59.000Z').dayAndMonth).toBe('04 OCT');
    expect(postmarkDay('2026-10-05T00:00:00.000Z').dayAndMonth).toBe('05 OCT');
  });
});
