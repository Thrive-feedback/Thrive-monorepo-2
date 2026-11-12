import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LandingMoments } from './landing-moments';

function moments() {
  return within(
    screen.getByRole('region', { name: 'Two moments that shouldn’t wait' }),
  ).getAllByRole('listitem');
}

function moment(index: number) {
  const item = moments()[index];
  if (!item) throw new Error(`No moment ${index}`);
  return item;
}

describe('LandingMoments', () => {
  it('tells two moments, each headed by when it happened', () => {
    render(<LandingMoments />);

    expect(moments()).toHaveLength(2);
    expect(
      screen.getByRole('heading', { name: 'Right after sprint planning' }),
    ).toBeInTheDocument();
  });

  it('tells one ask and one feedback given unasked', () => {
    render(<LandingMoments />);

    expect(
      moments().map(
        (item) => within(item).getByText(/^(Asked|Gave)$/).textContent,
      ),
    ).toEqual(['Asked', 'Gave']);
  });

  it('shows what came back for both', () => {
    render(<LandingMoments />);

    expect(within(moment(0)).getByText('What came back')).toBeInTheDocument();
    expect(within(moment(1)).getByText('What came back')).toBeInTheDocument();
  });

  it('opens a Moment’s card to read, titled as the app titles a card it reads', async () => {
    const user = userEvent.setup();
    render(<LandingMoments />);

    await user.click(
      screen.getByRole('button', {
        name: 'Read the card: Right after sprint planning',
      }),
    );

    expect(
      // The dialog's code is fetched on the press, which a busy run can slow past the default wait.
      await screen.findByRole(
        'dialog',
        { name: /Feedback from Ben Carter/ },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it('closes on what each moment waits for without Thrive', () => {
    render(<LandingMoments />);

    expect(
      screen.getByText(
        'Without Thrive, both wait for the review, the retro or the final grade.',
      ),
    ).toBeInTheDocument();
  });
});
