import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeedbackText } from './feedback-text';

describe('FeedbackText', () => {
  it('shows the Workspace Goals and Members it was bound to, and leaves the rest as written', () => {
    render(
      <p data-testid="feedback">
        <FeedbackText
          text="Great work #Ownership with @cara.lee #notalist @dan"
          tags={{
            workspaceGoals: [{ name: 'ownership' }],
            mentions: [{ slug: 'cara.lee', displayName: 'Cara' }],
          }}
        />
      </p>,
    );

    expect(screen.getByTestId('feedback')).toHaveTextContent(
      'Great work #ownership with @Cara #notalist @dan',
    );
    expect(screen.getByText('#ownership')).toHaveClass('text-fg-accent');
    expect(screen.getByText('@Cara')).toHaveClass('text-action-secondary');
  });
});
