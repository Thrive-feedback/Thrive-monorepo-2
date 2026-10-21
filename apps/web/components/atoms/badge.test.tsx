import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('reads as its words', () => {
    render(<Badge tone="success">Answered</Badge>);

    expect(screen.getByText('Answered')).toBeInTheDocument();
  });

  it('paints a link as a badge, and stays a link', () => {
    render(
      <Badge asChild tone="brand">
        <a href="/ui-showcase/badge">Badge</a>
      </Badge>,
    );

    expect(screen.getByRole('link', { name: 'Badge' })).toHaveAttribute(
      'href',
      '/ui-showcase/badge',
    );
  });
});
