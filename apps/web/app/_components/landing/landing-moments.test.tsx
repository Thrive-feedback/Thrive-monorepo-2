import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LandingMoments } from './landing-moments';

function moments() {
  return within(
    screen.getByRole('region', { name: 'Four moments that shouldn’t wait' }),
  ).getAllByRole('listitem');
}

function moment(index: number) {
  const item = moments()[index];
  if (!item) throw new Error(`No moment ${index}`);
  return item;
}

describe('LandingMoments', () => {
  it('tells four moments, each headed by when it happened', () => {
    render(<LandingMoments />);

    expect(moments()).toHaveLength(4);
    expect(
      screen.getByRole('heading', {
        name: '10 minutes after the investor pitch',
      }),
    ).toBeInTheDocument();
  });

  it('tells two asks, one feedback given unasked and one Kudos', () => {
    render(<LandingMoments />);

    expect(
      moments().map(
        (item) => within(item).getByText(/^(Asked|Gave|Kudos)$/).textContent,
      ),
    ).toEqual(['Asked', 'Asked', 'Gave', 'Kudos']);
  });

  it('shows what came back for asks and feedback, and nothing back for Kudos', () => {
    render(<LandingMoments />);

    const pitch = moment(0);
    const rehearsal = moment(2);
    const kudos = moment(3);
    expect(within(pitch).getByText('What came back')).toBeInTheDocument();
    expect(within(rehearsal).getByText('What came back')).toBeInTheDocument();
    expect(within(kudos).getByText('Kudos')).toBeInTheDocument();
    expect(within(kudos).queryByText('What came back')).toBeNull();
  });

  it('closes on what each moment waits for without Thrive', () => {
    render(<LandingMoments />);

    expect(
      screen.getByText(
        'Without Thrive, each of these waits for the review, the retro or the final grade.',
      ),
    ).toBeInTheDocument();
  });
});
