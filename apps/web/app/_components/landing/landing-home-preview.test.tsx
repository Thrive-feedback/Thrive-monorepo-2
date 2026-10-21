import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { preloadComposerForms } from '@/components/organisms/feedback-composer';
import {
  LandingHomePreview,
  preloadAnswerDialog,
} from './landing-home-preview';

// The dialog asks for the router, which only matters when it closes to an address; the preview
// closes it in place, so the router is never used.
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

// The forms and the answer dialog load apart from the page. Fetched first, as the page fetches
// them when idle, they draw at once, as they do for anyone who has been on the page a moment.
beforeAll(() => Promise.all([preloadComposerForms(), preloadAnswerDialog()]));

/*
 * Home draws a narrow layout and a wide one and CSS shows one, so jsdom sees both: every control
 * appears twice. These tests drive the first, the narrow one, as a phone visitor would.
 */
function first(role: string, name: string | RegExp) {
  const [element] = screen.getAllByRole(role, { name });
  if (!element) throw new Error(`No ${role} named ${name}`);
  return element;
}

function preview() {
  return screen.getByRole('region', { name: 'Preview of Thrive Home' });
}

describe('LandingHomePreview', () => {
  it('is Home on made-up data, under the page’s own heading', () => {
    render(<LandingHomePreview />);

    expect(
      within(preview()).getAllByRole('heading', {
        level: 2,
        name: 'Sunrise Studio',
      }).length,
    ).toBeGreaterThan(0);
    expect(within(preview()).queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.queryByText(/Preview data/)).toBeNull();
  });

  it('switches tabs in place, without leaving the page', async () => {
    const user = userEvent.setup();
    render(<LandingHomePreview />);

    // Fern's question is also on Shared with me, which the wide layout opens beside the feed, so
    // the Ask is told apart by who asked it.
    expect(screen.queryByText(/Asked by/)).toBeNull();

    await user.click(first('button', 'Waiting for me'));

    expect(first('button', 'Waiting for me')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByText(/Asked by/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Waiting for me' })).toBeNull();
  });

  it('counts a Reaction when it is pressed', async () => {
    const user = userEvent.setup();
    render(<LandingHomePreview />);

    await user.click(first('button', 'Clap, 2'));

    expect(first('button', 'Clap, 3')).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches between asking for and giving Feedback', async () => {
    const user = userEvent.setup();
    render(<LandingHomePreview />);

    await user.click(first('button', 'Give feedback'));

    expect(first('button', 'Give feedback')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('opens an Ask, takes an answer, and then says the answer stands', async () => {
    const user = userEvent.setup();
    render(<LandingHomePreview />);

    await user.click(first('button', 'Waiting for me'));
    await user.click(
      first('button', 'In our run-through just now, where did you get lost?'),
    );
    const dialog = screen.getByRole('dialog', { name: 'Give your feedback' });
    await user.type(
      within(dialog).getByRole('textbox', {
        name: /What would you tell Fern Somsak/,
      }),
      'Lead with the price for small teams.',
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Send answer' }),
    );

    expect(
      await within(dialog).findByText(/You have already answered this/),
    ).toBeInTheDocument();
  });

  it('lists a sent request under My requests', async () => {
    const user = userEvent.setup();
    render(<LandingHomePreview />);

    // Driven from the keyboard rather than clicked: jsdom lays everything out at zero size, so
    // the resize slug's hit area covers every click in the form and takes it.
    first('button', 'Ask for advice…').focus();
    await user.keyboard('{Enter}');
    first('combobox', /What should they talk about/).focus();
    await user.keyboard('My first board update');
    first('combobox', /Who do you want to ask/).focus();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('option', { name: 'Arm Wattana' }));
    first('button', 'Send request').focus();
    await user.keyboard('{Enter}');

    expect(
      await screen.findAllByText('My first board update'),
    ).not.toHaveLength(0);
    expect(first('button', 'My requests')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
