import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HrLanding } from './hr-landing';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

describe('HrLanding', () => {
  it('names each section by its heading', () => {
    render(<HrLanding />);

    for (const name of [
      HR_LANDING_COPY.hero.headline,
      'You already run feedback. It’s a Google Form.',
      'You set it up. Your team keeps it going.',
      HR_LANDING_COPY.promise.title,
      HR_LANDING_COPY.insights.title,
      HR_LANDING_COPY.compare.title,
      HR_LANDING_COPY.founder.quote,
      HR_LANDING_COPY.faq.title,
      HR_LANDING_COPY.closing.title,
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('leads every Book a demo to the same place', () => {
    render(<HrLanding />);

    const demos = screen.getAllByRole('link', { name: 'Book a demo' });
    expect(demos).toHaveLength(3);
    for (const link of demos) {
      expect(link).toHaveAttribute('href', HR_LANDING_COPY.demoHref);
    }
  });

  it('leads Book a demo to the closing section, which is on the page', () => {
    const { container } = render(<HrLanding />);

    expect(container.querySelector(HR_LANDING_COPY.demoHref)).toBe(
      screen.getByRole('region', { name: HR_LANDING_COPY.closing.title }),
    );
  });

  it('keeps sign-in within reach for whoever wants to try it alone', () => {
    render(<HrLanding />);

    for (const link of [
      screen.getByRole('link', { name: 'Sign in' }),
      screen.getByRole('link', { name: HR_LANDING_COPY.closing.signIn }),
    ]) {
      expect(link).toHaveAttribute('href', '/signin');
    }
  });

  it('shows the team’s side of Thrive from the hero', () => {
    render(<HrLanding />);

    expect(
      screen.getByRole('link', { name: HR_LANDING_COPY.hero.teams }),
    ).toHaveAttribute('href', '/for-teams');
  });

  it('says plainly that Insights is not here yet', () => {
    render(<HrLanding />);

    const insights = screen.getByRole('region', {
      name: HR_LANDING_COPY.insights.title,
    });
    expect(within(insights).getByText('Coming soon')).toBeInTheDocument();
  });

  it('compares Thrive with the Google Form and the annual review, row by row', () => {
    render(<HrLanding />);

    const table = screen.getByRole('table');
    for (const column of ['Thrive', 'Google Form', 'Annual review']) {
      expect(
        within(table).getByRole('columnheader', { name: column }),
      ).toBeInTheDocument();
    }
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(HR_LANDING_COPY.compare.rows.map((row) => row.aspect));
  });

  it('opens an FAQ answer when its question is pressed, the first already open', async () => {
    const user = userEvent.setup();
    render(<HrLanding />);
    const [first, second] = HR_LANDING_COPY.faq.items;

    const firstQuestion = screen.getByText(first.question).closest('details');
    const secondQuestion = screen.getByText(second.question).closest('details');
    expect(firstQuestion).toHaveAttribute('open');
    expect(secondQuestion).not.toHaveAttribute('open');

    await user.click(screen.getByText(second.question));

    expect(secondQuestion).toHaveAttribute('open');
  });
});
