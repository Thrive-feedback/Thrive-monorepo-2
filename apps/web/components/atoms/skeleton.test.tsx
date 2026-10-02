import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is kept out of the accessibility tree, so the busy region speaks for it', () => {
    render(
      <section aria-label="Profile" aria-busy="true">
        <Skeleton shape="circle" />
        <Skeleton />
      </section>,
    );

    const region = screen.getByRole('region', { name: 'Profile' });
    expect(region).toHaveAttribute('aria-busy', 'true');
    for (const bar of region.children) {
      expect(bar).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
