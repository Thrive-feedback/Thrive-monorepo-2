import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './logo';

describe('Logo', () => {
  it('is one image named Thrive, whatever the theme', () => {
    render(<Logo />);

    expect(screen.getAllByRole('img', { name: 'Thrive' })).toHaveLength(1);
  });

  it('takes a size from the caller, keeping its name', () => {
    render(<Logo className="h-12 w-40" />);

    expect(screen.getByRole('img', { name: 'Thrive' })).toHaveClass(
      'h-12',
      'w-40',
    );
  });
});
