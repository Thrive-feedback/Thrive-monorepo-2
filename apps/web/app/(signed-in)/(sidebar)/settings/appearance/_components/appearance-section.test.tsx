import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FeedbackStyleProvider } from '@/components/organisms/feedback-style-provider';
import { AppearanceSection } from './appearance-section';

/** Each example by its caption, the one chosen said so. */
function examples() {
  return screen
    .getAllByRole('figure')
    .map((figure) => figure.querySelector('figcaption')?.textContent);
}

describe('AppearanceSection', () => {
  it('offers the Feedback style beside the theme, with the same card drawn in each style', () => {
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <AppearanceSection />
      </FeedbackStyleProvider>,
    );

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByText('Feedback style')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Plain style' }),
    ).not.toBeChecked();
    expect(examples()).toEqual(['Postcard (chosen)', 'Plain']);
  });

  it('marks the other example as chosen once it is pressed', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <AppearanceSection />
      </FeedbackStyleProvider>,
    );

    await user.click(screen.getByRole('switch', { name: 'Plain style' }));

    expect(examples()).toEqual(['Postcard', 'Plain (chosen)']);
  });
});
