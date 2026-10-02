import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('titles its content with a top-level heading by default', () => {
    render(<Card title="Welcome">Body</Card>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('takes the heading level the page gives it', () => {
    render(
      <Card title="Introduce yourself" titleAs="h2">
        Body
      </Card>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Introduce yourself' }),
    ).toBeInTheDocument();
  });
});
