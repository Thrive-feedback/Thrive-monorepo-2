import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link } from './link';

describe('Link', () => {
  it('navigates within the app in the same tab', () => {
    render(<Link href="/signin">Sign in</Link>);
    const link = screen.getByRole('link', { name: 'Sign in' });

    expect(link).toHaveAttribute('href', '/signin');
    expect(link).not.toHaveAttribute('target');
  });

  it('says when it opens a new tab, and gives the other site no handle on this one', () => {
    render(
      <Link href="https://example.com/terms" external>
        Terms
      </Link>,
    );
    const link = screen.getByRole('link', {
      name: 'Terms (opens in a new tab)',
    });

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
