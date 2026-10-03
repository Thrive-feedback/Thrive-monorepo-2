import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Landing from './page';

vi.mock('@/lib/api-base-url.util', () => ({
  apiBaseUrl: () => 'http://localhost:3000',
}));

describe('Landing', () => {
  it('points at the component showcase and the API reference', () => {
    render(<Landing />);

    expect(
      screen.getByRole('link', { name: 'See the components' }),
    ).toHaveAttribute('href', '/ui-showcase');
    const reference = screen.getByRole('link', {
      name: 'Open the API reference (opens in a new tab)',
    });
    expect(reference).toHaveAttribute(
      'href',
      'http://localhost:3000/reference',
    );
    expect(reference).toHaveAttribute('target', '_blank');
  });
});
