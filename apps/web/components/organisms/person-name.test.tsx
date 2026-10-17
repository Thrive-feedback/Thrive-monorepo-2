import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PersonName } from './person-name';

describe('PersonName', () => {
  it('shows an active person by name alone', () => {
    render(
      <p>
        <PersonName name="Ann Lee" />
      </p>,
    );

    expect(screen.getByText('Ann Lee')).toBeInTheDocument();
    expect(screen.queryByText(/inactive/)).not.toBeInTheDocument();
  });

  it('shows a Deactivated person in grey, followed by "(inactive)"', () => {
    render(
      <p>
        <PersonName name="Ann Lee" inactive />
      </p>,
    );

    expect(screen.getByText('Ann Lee (inactive)')).toHaveClass(
      'text-fg-secondary',
    );
  });
});
