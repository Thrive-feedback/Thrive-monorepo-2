import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton, SkeletonRegion } from './skeleton';

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

describe('SkeletonRegion', () => {
  it('says once that it is loading, and marks itself busy', () => {
    render(
      <SkeletonRegion>
        <p>Display name</p>
        <Skeleton />
      </SkeletonRegion>,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading…');
  });

  it('makes what it holds inert, so nothing in it is read out or pressed before the page arrives', () => {
    render(
      <SkeletonRegion>
        <button type="button">Sign out</button>
      </SkeletonRegion>,
    );

    expect(
      screen
        .getByRole('button', { name: 'Sign out', hidden: true })
        .closest('[inert]'),
    ).not.toBeNull();
  });
});
