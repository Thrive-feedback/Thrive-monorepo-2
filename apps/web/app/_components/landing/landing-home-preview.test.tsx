import { render, screen, waitFor, within } from '@testing-library/react';
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

    await user.click(first('button', 'My requests'));

    expect(first('button', 'My requests')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('link', { name: 'My requests' })).toBeNull();
  });

  it('keeps what is waiting in view above the tabs, whichever is open', () => {
    render(<LandingHomePreview />);

    expect(first('heading', 'Waiting for me')).toBeInTheDocument();
    expect(screen.getAllByText(/asked you/).length).toBeGreaterThan(0);
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

  it('lists a request sent to several teammates under My requests', async () => {
    const user = userEvent.setup();
    render(<LandingHomePreview />);

    // Driven from the keyboard rather than clicked: jsdom lays everything out at zero size, so
    // the resize slug's hit area covers every click in the form and takes it.
    // The composer opens ready to write, on asking for Feedback.
    first('textbox', /What would you like feedback on/).focus();
    await user.keyboard('My first board update');
    first('button', /Who do you want to ask/).focus();
    await user.keyboard('{Enter}');
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Arm Wattana' }),
    );
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Nok Chaiyo' }),
    );
    await user.keyboard('{Escape}');
    first('button', 'Send request').focus();
    await user.keyboard('{Enter}');

    // The message box draws what is typed as text of its own, so the request is looked for as a
    // row of My requests, once that tab has opened, rather than anywhere on the page.
    await waitFor(() =>
      expect(first('button', 'My requests')).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(
      screen
        .getAllByRole('article')
        .some((row) => row.textContent?.includes('My first board update')),
    ).toBe(true);
  });
});
